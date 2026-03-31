import {
  BlobServiceClient,
  StorageSharedKeyCredential,
} from '@azure/storage-blob';
import { status } from '@grpc/grpc-js';
import { RpcException } from '@nestjs/microservices';
import { FileBucketProto, FileProviderProto } from 'juno-proto';

export class AzureBucketHandler {
  constructor(private provider: FileProviderProto.FileProvider) {}

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

  async registerBucket(request: FileBucketProto.RegisterBucketRequest) {
    try {
      const blobClient = await this.getBlobServiceClient();
      await blobClient
        .getContainerClient(
          `${request.name}-${request.configId}-${request.configEnv}`,
        )
        .create();
    } catch (error) {
      throw new RpcException({
        code: status.FAILED_PRECONDITION,
        message: `Failed to create bucket: ${error.message} `,
      });
    }
  }

  async removeBucket(request: FileBucketProto.RemoveBucketRequest) {
    try {
      const blobClient = await this.getBlobServiceClient();
      await blobClient
        .getContainerClient(
          `${request.name}-${request.configId}-${request.configEnv}`,
        )
        .delete();
    } catch (error) {
      throw new RpcException({
        code: status.FAILED_PRECONDITION,
        message: `Failed to delete bucket: ${error.message} `,
      });
    }
  }

  async listFiles(
    request: FileBucketProto.GetBucketRequest,
  ): Promise<string[]> {
    try {
      const blobClient = await this.getBlobServiceClient();
      const containerClient = blobClient.getContainerClient(
        `${request.name}-${request.configId}-${request.configEnv}`,
      );
      const files: string[] = [];
      for await (const blob of containerClient.listBlobsFlat()) {
        files.push(blob.name);
      }
      return files;
    } catch (error) {
      throw new RpcException({
        code: status.FAILED_PRECONDITION,
        message: `Failed to list files: ${error.message} `,
      });
    }
  }
}
