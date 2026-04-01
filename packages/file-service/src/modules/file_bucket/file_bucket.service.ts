import { status } from '@grpc/grpc-js';
import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ClientGrpc, RpcException } from '@nestjs/microservices';
import { FileBucketProto, FileProviderProto } from 'juno-proto';
import { lastValueFrom } from 'rxjs';
import { AzureBucketHandler } from './azure_handler';
import { S3BucketHandler } from './s3_handler';

@Injectable()
export class FileBucketService implements OnModuleInit {
  private readonly logger = new Logger(FileBucketService.name);
  private fileBucketDBService: FileBucketProto.BucketDbServiceClient;
  private fileProviderDBService: FileProviderProto.FileProviderDbServiceClient;

  constructor(
    @Inject(FileBucketProto.BUCKET_DB_SERVICE_NAME)
    private fileDBClient: ClientGrpc,
    @Inject(FileProviderProto.FILE_PROVIDER_DB_SERVICE_NAME)
    private fileProviderDBClient: ClientGrpc,
  ) {}

  onModuleInit() {
    this.fileBucketDBService =
      this.fileDBClient.getService<FileBucketProto.BucketDbServiceClient>(
        FileBucketProto.BUCKET_DB_SERVICE_NAME,
      );
    this.fileProviderDBService =
      this.fileProviderDBClient.getService<FileProviderProto.FileProviderDbServiceClient>(
        FileProviderProto.FILE_PROVIDER_DB_SERVICE_NAME,
      );
  }

  async getProvider(
    providerName: string,
  ): Promise<FileProviderProto.FileProvider> {
    try {
      return await lastValueFrom(
        this.fileProviderDBService.getProvider({
          providerName: providerName,
        }),
      );
    } catch (error) {
      throw new RpcException({
        code: status.FAILED_PRECONDITION,
        message: `Failed to initialize S3 client: ${error.message} `,
      });
    }
  }

  async registerBucket(
    request: FileBucketProto.RegisterBucketRequest,
  ): Promise<FileBucketProto.Bucket> {
    try {
      const provider = await this.getProvider(request.fileProviderName);
      switch (provider.providerType) {
        case FileProviderProto.ProviderType.S3: {
          const handler = new S3BucketHandler(provider);
          await handler.registerBucket(request);
          break;
        }
        case FileProviderProto.ProviderType.AZURE: {
          const handler = new AzureBucketHandler(provider);
          await handler.registerBucket(request);
          break;
        }
        default:
          throw new RpcException({
            code: status.FAILED_PRECONDITION,
            message: `Unsupported provider type: ${provider.providerType} `,
          });
      }

      // Save bucket to Juno DB after successfully registered with provider
      const bucket = await lastValueFrom(
        this.fileBucketDBService.createBucket(request),
      );

      return bucket;
    } catch (error) {
      if (error.message.toLowerCase().includes('you already own it')) {
        throw new RpcException({
          code: status.ALREADY_EXISTS,
          message: 'Bucket already exists',
        });
      }
      throw new RpcException({
        code: status.FAILED_PRECONDITION,
        message: `Failed to create bucket: ${error.message} `,
      });
    }
  }

  async removeBucket(
    request: FileBucketProto.RemoveBucketRequest,
  ): Promise<FileBucketProto.Bucket> {
    try {
      const provider = await this.getProvider(request.fileProviderName);
      switch (provider.providerType) {
        case FileProviderProto.ProviderType.S3: {
          const handler = new S3BucketHandler(provider);
          await handler.removeBucket(request);
          break;
        }
        case FileProviderProto.ProviderType.AZURE: {
          const handler = new AzureBucketHandler(provider);
          await handler.removeBucket(request);
          break;
        }
        default:
          throw new RpcException({
            code: status.FAILED_PRECONDITION,
            message: `Unsupported provider type: ${provider.providerType} `,
          });
      }

      // Delete bucket from Juno DB after successfully deleted from provider
      const bucket = await lastValueFrom(
        this.fileBucketDBService.deleteBucket({
          name: request.name,
          configId: request.configId,
          configEnv: request.configEnv,
        }),
      );
      return bucket;
    } catch (error) {
      if (error.message.includes('NoSuchBucket')) {
        throw new RpcException({
          code: status.NOT_FOUND,
          message: 'Bucket not found',
        });
      }
      throw new RpcException({
        code: status.FAILED_PRECONDITION,
        message: `Failed to delete bucket: ${error.message} `,
      });
    }
  }

  async getAllFiles(
    request: FileBucketProto.GetAllFilesRequest,
  ): Promise<FileBucketProto.GetAllFilesResponse> {
    try {
      const buckets = await lastValueFrom(
        this.fileBucketDBService.getBucketsByConfigIdAndEnv({
          configId: request.configId,
          configEnv: request.configEnv,
        }),
      );

      const results = await Promise.all(
        (buckets.buckets ?? []).map(async (bucket) => {
          try {
            const provider = await this.getProvider(bucket.fileProviderName);
            const bucketRequest: FileBucketProto.GetBucketRequest = {
              name: bucket.name,
              configId: bucket.configId,
              configEnv: bucket.configEnv,
            };

            let fileList: string[];
            switch (provider.providerType) {
              case FileProviderProto.ProviderType.S3: {
                const handler = new S3BucketHandler(provider);
                fileList = await handler.listFiles(bucketRequest);
                break;
              }
              case FileProviderProto.ProviderType.AZURE: {
                const handler = new AzureBucketHandler(provider);
                fileList = await handler.listFiles(bucketRequest);
                break;
              }
              default:
                throw new RpcException({
                  code: status.FAILED_PRECONDITION,
                  message: `Unsupported provider type: ${provider.providerType} `,
                });
            }

            return {
              bucketName: bucket.name,
              files: fileList,
            };
          } catch (error) {
            this.logger.error(
              `Failed to list files for bucket "${bucket.name}": ${error?.message}`,
            );
            return null;
          }
        }),
      );

      const files = results.filter(
        (result): result is FileBucketProto.Files => result !== null,
      );

      return { files };
    } catch (error) {
      if (error instanceof RpcException) {
        throw error;
      }
      throw new RpcException({
        code: status.FAILED_PRECONDITION,
        message: `Failed to get all files: ${error.message} `,
      });
    }
  }
}
