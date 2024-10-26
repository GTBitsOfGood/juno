import { Controller } from '@nestjs/common';
import { FileBucketProto } from 'juno-proto';
import { RpcException } from '@nestjs/microservices';
import { BucketBucketDbServiceController } from 'juno-proto/dist/gen/file_bucket';
import { FileBucketService } from './file_bucket.service';
import {
    validateFileBucketIdentifier,
    validateBucket
} from 'src/utility/validate';
import { status } from '@grpc/grpc-js';

@Controller()
@FileBucketProto.BucketBucketDbServiceControllerMethods()
export class FileBucketController implements BucketBucketDbServiceController {
    constructor(private readonly fileBucketService: FileBucketService) { }
    async getBucket(
        request: FileBucketProto.GetFileBucketRequest,
    ): Promise<FileBucketProto.FileBucket> {
        validateFileBucketIdentifier(request);
        const fileBucket = await this.fileBucketService.getBucket(request);
        if (!fileBucket) {
            throw new RpcException({
                code: status.NOT_FOUND,
                message: 'Bucket not found',
            });
        }
        return fileBucket;
    }
    async createBucket(
        request: FileBucketProto.CreateFileBucketRequest,
    ): Promise<FileBucketProto.FileBucket> {
        validateBucket(request)
        return this.fileBucketService.createBucket(request);
    }
    async deleteBucket(
        request: FileBucketProto.DeleteFileBucketRequest,
    ): Promise<FileBucketProto.FileBucket> {
        validateFileBucketIdentifier(request);
        return this.fileBucketService.deleteBucket(request);
    }
    async updateBucket(
        request: FileBucketProto.UpdateFileBucketRequest,
    ): Promise<FileBucketProto.FileBucket> {
        validateFileBucketIdentifier(request);
        return this.fileBucketService.updateBucket(request);
    }
}