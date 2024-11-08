import { Controller } from '@nestjs/common';
import { FileBucketService } from './file_bucket.service';
import { FileBucketProto } from 'juno-proto';
import { RpcException } from '@nestjs/microservices';

@Controller('file-bucket')
export class FileBucketController {

  constructor(private readonly fileBucketService: FileBucketService) {}

  async createBucket(request: FileBucketProto.CreateBucketRequest): Promise<{ success: boolean }> {
    
    try {
      await this.fileBucketService.createBucket(request);
      return { success: true };
    } catch (error) {
      throw new RpcException({
        code: error.code,
        message: error.message,
      });
    }
  }
}