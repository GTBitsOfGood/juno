import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import {
  S3Client,
  CreateBucketCommand,
  DeleteBucketCommand,
} from '@aws-sdk/client-s3';
import { FileBucketProto, FileProviderProto } from 'juno-proto';
import { ClientGrpc, RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { lastValueFrom } from 'rxjs';

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

  async getS3ClientForProvider(
    providerName: string,
    region: string,
  ): Promise<S3Client> {
    try {
      const provider = await lastValueFrom(
        this.fileProviderDBService.getProvider({
          providerName: providerName,
        }),
      );

      const metadata = {
        ...JSON.parse(provider.metadata),
        region: region,
        credentials: JSON.parse(provider.accessKey),
      };
      return new S3Client(metadata);
    } catch (error) {
      throw new RpcException({
        code: status.INTERNAL,
        message: `Failed to initialize S3 client: ${error.message} `,
      });
    }
  }

  async registerBucket(
    request: FileBucketProto.RegisterBucketRequest,
  ): Promise<FileBucketProto.Bucket> {
    try {
      const s3Client = await this.getS3ClientForProvider(
        request.fileProviderName,
        'us-east-005',
      );
      const createBucketCommand = new CreateBucketCommand({
        Bucket: request.name,
      });
      await s3Client.send(createBucketCommand);

      const dbBucket = await lastValueFrom(
        this.fileDBService.createBucket(request),
      );
      return dbBucket;
    } catch (error) {
      if (error.message.toLowerCase().includes('you already own it')) {
        throw new RpcException({
          code: status.ALREADY_EXISTS,
          message: 'Bucket already exists',
        });
      }
      throw new RpcException({
        code: status.INTERNAL,
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
      const s3Client = await this.getS3ClientForProvider(
        bucket.fileProviderName,
        'us-east-005',
      );
      const deleteBucketCommand = new DeleteBucketCommand({
        Bucket: request.name,
      });
      await s3Client.send(deleteBucketCommand);
      return bucket;
    } catch (error) {
      if (error.message.includes('NoSuchBucket')) {
        throw new RpcException({
          code: status.NOT_FOUND,
          message: 'Bucket not found',
        });
      }
      throw new RpcException({
        code: status.INTERNAL,
        message: `Failed to delete bucket: ${error.message} `,
      });
    }
  }
}
