import { Controller } from '@nestjs/common';
import { FileBucketService } from './file_bucket.service';
import { FileBucketProto } from 'juno-proto';
import { RpcException } from '@nestjs/microservices';

@Controller()
@FileBucketProto.BucketFileServiceControllerMethods()
export class FileBucketController
  implements FileBucketProto.BucketFileServiceController
{
  constructor(private readonly fileBucketService: FileBucketService) {}

  async registerBucket(
    request: FileBucketProto.RegisterBucketRequest,
  ): Promise<FileBucketProto.Bucket> {
    try {
      return await this.fileBucketService.registerBucket(request);
    } catch (error) {
      throw new RpcException({
        code: error.code,
        message: `Failed to register bucket: ${error.message}`,
      });
    }
  }

  async removeBucket(
    request: FileBucketProto.RemoveBucketRequest,
  ): Promise<FileBucketProto.Bucket> {
    try {
      return await this.fileBucketService.removeBucket(request);
    } catch (error) {
      throw new RpcException({
        code: error.code,
        message: `Failed to remove bucket: ${error.message}`,
      });
    }
  }
}
