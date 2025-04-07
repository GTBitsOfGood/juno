import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { FileBucketProto, FileProviderProto } from 'juno-proto';
import { ClientGrpc, RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { lastValueFrom } from 'rxjs';
import { S3BucketHandler } from './s3_handler';
import { AzureBucketHandler } from './azure_handler';

@Injectable()
export class FileBucketService implements OnModuleInit {
  private fileDBService: FileBucketProto.BucketDbServiceClient;
  private fileProviderDBService: FileProviderProto.FileProviderDbServiceClient;

  constructor(
    @Inject(FileBucketProto.BUCKET_DB_SERVICE_NAME)
    private fileDBClient: ClientGrpc,
    @Inject(FileProviderProto.FILE_PROVIDER_DB_SERVICE_NAME)
    private fileProviderDBClient: ClientGrpc,
  ) {}

  onModuleInit() {
    this.fileDBService =
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
          const handler = new S3BucketHandler(this.fileDBService, provider);
          return handler.registerBucket(request);
        }
        case FileProviderProto.ProviderType.AZURE: {
          const handler = new AzureBucketHandler(this.fileDBService, provider);
          return handler.registerBucket(request);
        }
        default:
          throw new RpcException({
            code: status.FAILED_PRECONDITION,
            message: `Unsupported provider type: ${provider.providerType} `,
          });
      }
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
      const bucket = await lastValueFrom(
        this.fileDBService.deleteBucket({
          name: request.name,
          configId: request.configId,
          configEnv: request.configEnv,
        }),
      );
      const provider = await this.getProvider(bucket.fileProviderName);
      switch (provider.providerType) {
        case FileProviderProto.ProviderType.S3: {
          const handler = new S3BucketHandler(this.fileDBService, provider);
          return handler.removeBucket(request);
        }
        case FileProviderProto.ProviderType.AZURE: {
          const handler = new AzureBucketHandler(this.fileDBService, provider);
          return handler.removeBucket(request);
        }
        default:
          throw new RpcException({
            code: status.FAILED_PRECONDITION,
            message: `Unsupported provider type: ${provider.providerType} `,
          });
      }
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
}
