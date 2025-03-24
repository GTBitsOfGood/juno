import { FileBucketProto, FileProviderProto } from 'juno-proto';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { lastValueFrom } from 'rxjs';
import { BlobServiceClient } from '@azure/storage-blob';

export class AzureBucketHandler {
  constructor(
    private fileDBService: FileBucketProto.BucketDbServiceClient,
    private provider: FileProviderProto.FileProvider,
  ) {}

  async getBlobServiceClient(): Promise<BlobServiceClient> {
    try {
      return BlobServiceClient.fromConnectionString(this.provider.accessKey);
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
      const blobClient = await this.getBlobServiceClient();
      await blobClient.getContainerClient(request.name).create();

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
      const blobClient = await this.getBlobServiceClient();
      await blobClient.getContainerClient(request.name).delete();
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
}
