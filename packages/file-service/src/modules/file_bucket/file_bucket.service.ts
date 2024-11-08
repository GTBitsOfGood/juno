import { Injectable } from '@nestjs/common';
import { S3Client, CreateBucketCommand } from '@aws-sdk/client-s3';
import { FileBucketProto } from 'juno-proto';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';

@Injectable()
export class FileBucketService {
  private s3Client: S3Client;

  constructor() {
    this.s3Client = null;
  }

  initializeS3Client(metadata: string) {
    try {
      this.s3Client = new S3Client(JSON.parse(metadata));
    } catch (error) {
      throw new RpcException({
        code: status.INTERNAL,
        message: 'Failed to initialize S3 client',
      });
    }
  }

  async createBucket(
    request: FileBucketProto.CreateBucketRequest,
  ): Promise<FileBucketProto.Bucket> {
    if (!this.s3Client) {
      throw new RpcException({
        code: status.FAILED_PRECONDITION,
        message: 'S3 client not initialized',
      });
    }

    try {
      const createBucketCommand = new CreateBucketCommand({ Bucket: request.name });
      await this.s3Client.send(createBucketCommand);

      const dbBucket = await this.dbService.createBucket(request);
      return dbBucket;
    } catch (error) {
      throw new RpcException({
        code: status.INTERNAL,
        message: `Failed to create bucket: ${error.message}`,
      });
    }
  }
}