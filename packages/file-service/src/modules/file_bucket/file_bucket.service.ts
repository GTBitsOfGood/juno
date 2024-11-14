import { Injectable, Inject } from '@nestjs/common';
import {
  S3Client,
  CreateBucketCommand,
  DeleteBucketCommand,
} from '@aws-sdk/client-s3';
import { FileBucketProto } from 'juno-proto';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';

@Injectable()
export class FileBucketService {
  private s3Client: S3Client | null = null;

  constructor(@Inject('DbService') private readonly dbService: any) {}

  initializeS3Client(metadata: string): void {
    try {
      const config = JSON.parse(metadata);
      this.s3Client = new S3Client(config);
    } catch (error) {
      throw new RpcException({
        code: status.INTERNAL,
        message: `Failed to initialize S3 client: ${error.message}`,
      });
    }
  }

  async registerBucket(
    request: FileBucketProto.RegisterBucketRequest,
  ): Promise<FileBucketProto.Bucket> {
    if (!this.s3Client) {
      throw new RpcException({
        code: status.FAILED_PRECONDITION,
        message: 'S3 client not initialized',
      });
    }

    try {
      const createBucketCommand = new CreateBucketCommand({
        Bucket: request.name,
      });
      await this.s3Client.send(createBucketCommand);

      const dbBucket = await this.dbService.createBucket(request);
      return dbBucket;
    } catch (error) {
      if (error.message.includes('Bucket already exists')) {
        throw new RpcException({
          code: status.ALREADY_EXISTS,
          message: 'Bucket already exists',
        });
      }
      throw new RpcException({
        code: status.INTERNAL,
        message: `Failed to create bucket: ${error.message}`,
      });
    }
  }

  async removeBucket(
    request: FileBucketProto.RemoveBucketRequest,
  ): Promise<void> {
    if (!this.s3Client) {
      throw new RpcException({
        code: status.FAILED_PRECONDITION,
        message: 'S3 client not initialized',
      });
    }

    try {
      const deleteBucketCommand = new DeleteBucketCommand({
        Bucket: request.name,
      });
      await this.s3Client.send(deleteBucketCommand);

      await this.dbService.deleteBucket(request.configId);
    } catch (error) {
      if (error.message.includes('NoSuchBucket')) {
        throw new RpcException({
          code: status.NOT_FOUND,
          message: 'Bucket not found',
        });
      }
      throw new RpcException({
        code: status.INTERNAL,
        message: `Failed to delete bucket: ${error.message}`,
      });
    }
  }
}
