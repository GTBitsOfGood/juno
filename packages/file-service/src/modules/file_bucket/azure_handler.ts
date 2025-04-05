import { FileBucketProto, FileProviderProto } from 'juno-proto';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { lastValueFrom } from 'rxjs';
import {
  BlobServiceClient,
  StorageSharedKeyCredential,
} from '@azure/storage-blob';

export class AzureBucketHandler {
  constructor(
    private fileDBService: FileBucketProto.BucketDbServiceClient,
    private provider: FileProviderProto.FileProvider,
  ) {}

  async getBlobServiceClient(): Promise<BlobServiceClient> {
    try {
      const accessKeyPayload = JSON.parse(this.provider.accessKey);
      if (!accessKeyPayload.accountName || !accessKeyPayload.accountKey) {
        throw new RpcException({
          code: status.FAILED_PRECONDITION,
          message: 'Invalid access key payload',
        });
      }
      const account = accessKeyPayload.accountName;
      const accountKey = accessKeyPayload.accountKey;

      const sharedKeyCredential = new StorageSharedKeyCredential(
        account,
        accountKey,
      );
      return new BlobServiceClient(
        `https://${account}.blob.core.windows.net`,
        sharedKeyCredential,
      );
    } catch (error) {
      throw new RpcException({
        code: status.FAILED_PRECONDITION,
        message: `Failed to initialize Azure client: ${error.message} `,
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
      throw new RpcException({
        code: status.FAILED_PRECONDITION,
        message: `Failed to delete bucket: ${error.message} `,
      });
    }
  }
}
