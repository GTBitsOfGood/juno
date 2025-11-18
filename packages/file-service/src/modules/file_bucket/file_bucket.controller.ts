import { Controller } from '@nestjs/common';
import { FileBucketProto } from 'juno-proto';
import { FileBucketService } from './file_bucket.service';

@Controller()
@FileBucketProto.BucketFileServiceControllerMethods()
export class FileBucketController
  implements FileBucketProto.BucketFileServiceController
{
  constructor(private readonly fileBucketService: FileBucketService) {}

  async registerBucket(
    request: FileBucketProto.RegisterBucketRequest,
  ): Promise<FileBucketProto.Bucket> {
    return await this.fileBucketService.registerBucket(request);
  }

  async removeBucket(
    request: FileBucketProto.RemoveBucketRequest,
  ): Promise<FileBucketProto.Bucket> {
    return await this.fileBucketService.removeBucket(request);
  }
}
