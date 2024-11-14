import { Controller } from '@nestjs/common';
import { FileBucketService } from './file_bucket.service';
import { FileBucketProto } from 'juno-proto';
import { RpcException } from '@nestjs/microservices';

@Controller('file-bucket')
export class FileBucketController {
  constructor(private readonly fileBucketService: FileBucketService) {}

  async registerBucket(
    request: FileBucketProto.RegisterBucketRequest,
  ): Promise<{ success: boolean }> {
    try {
      await this.fileBucketService.registerBucket(request);
      return { success: true };
    } catch (error) {
      throw new RpcException({
        code: error.code,
        message: `Failed to register bucket: ${error.message}`,
      });
    }
  }

  async removeBucket(
    request: FileBucketProto.RemoveBucketRequest,
  ): Promise<{ success: boolean }> {
    try {
      await this.fileBucketService.removeBucket(request);
      return { success: true };
    } catch (error) {
      throw new RpcException({
        code: error.code,
        message: `Failed to remove bucket: ${error.message}`,
      });
    }
  }
}
