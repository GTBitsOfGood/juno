import {
  S3Client,
  CreateBucketCommand,
  DeleteBucketCommand,
} from '@aws-sdk/client-s3';
import { FileBucketProto, FileProviderProto } from 'juno-proto';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { lastValueFrom } from 'rxjs';

export class S3BucketHandler {
  constructor(
    private fileDBService: FileBucketProto.BucketDbServiceClient,
    private provider: FileProviderProto.FileProvider,
  ) {}

  async getS3Client(region: string): Promise<S3Client> {
    try {
      const metadata = {
        ...JSON.parse(this.provider.metadata),
        region: region,
        credentials: JSON.parse(this.provider.accessKey),
      };
      return new S3Client(metadata);
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
      const s3Client = await this.getS3Client('us-east-005');
      const createBucketCommand = new CreateBucketCommand({
        Bucket: `${request.name}-${request.configId}-${request.configEnv}`,
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
        code: status.FAILED_PRECONDITION,
        message: `Failed to create bucket: ${error.message} `,
      });
    }
  }

  async removeBucket(
    request: FileBucketProto.RemoveBucketRequest,
  ): Promise<FileBucketProto.Bucket> {
    try {
      const s3Client = await this.getS3Client('us-east-005');
      const deleteBucketCommand = new DeleteBucketCommand({
        Bucket: `${request.name}-${request.configId}-${request.configEnv}`,
      });
      await s3Client.send(deleteBucketCommand);
      const bucket = await lastValueFrom(
        this.fileDBService.deleteBucket({
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
}
