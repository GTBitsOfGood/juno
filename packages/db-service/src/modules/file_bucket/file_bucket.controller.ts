import { Controller } from '@nestjs/common';
import { FileBucketProto, IdentifierProto } from 'juno-proto';
import { RpcException } from '@nestjs/microservices';
import { BucketBucketDbServiceController } from 'juno-proto/dist/gen/file_bucket';
import { FileBucketService } from './file_bucket.service';
import { status } from '@grpc/grpc-js';

@Controller()
@FileBucketProto.BucketBucketDbServiceControllerMethods()
export class FileBucketController implements BucketBucketDbServiceController {
    constructor(private readonly fileBucketService: FileBucketService) { }
    async getBucket(
        request: FileBucketProto.GetBucketRequest,
    ): Promise<FileBucketProto.Bucket> {
        if (!request.name || !request.configId) {
            throw new RpcException({
                code: status.INVALID_ARGUMENT,
                message: 'Both name and configId must be provided',
            });
        }
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
        request: FileBucketProto.CreateBucketRequest,
    ): Promise<FileBucketProto.Bucket> {
        if (
            !request.name ||
            !request.configId ||
            !request.fileProviderName
        ) {
            throw new RpcException({
                code: status.INVALID_ARGUMENT,
                message:
                    'Name, configId, file provider name, files, and metadata must be provided',
            });
        }
        type ResType = {
            name: string;
            configId: number;
            fileProviderName: string;
            FileServiceFile?: Array<IdentifierProto.FileIdentifier>;  // Include FileServiceFile as optional
        };
        //attach foreign keys to config, file provider, and fileservice file when we have access to foreign keys
        const res: ResType = await this.fileBucketService.createBucket(request);
        if (!res.FileServiceFile) {
            res.FileServiceFile = []
        }
        const returning: FileBucketProto.Bucket = {
            name: res.name,
            configId: res.configId,
            fileProviderName: res.fileProviderName,
            FileServiceFile: res.FileServiceFile
        }
        return returning;
    }
    async deleteBucket(
        request: FileBucketProto.DeleteBucketRequest,
    ): Promise<FileBucketProto.Bucket> {
        if (!request.name || !request.configId) {
            throw new RpcException({
                code: status.INVALID_ARGUMENT,
                message: 'Both name and configId must be provided',
            });
        }
        return this.fileBucketService.deleteBucket(request);
    }
    async updateBucket(
        request: FileBucketProto.UpdateBucketRequest,
    ): Promise<FileBucketProto.Bucket> {
        if (!request.name || !request.configId || !request.fileProviderName) {
            throw new RpcException({
                code: status.INVALID_ARGUMENT,
                message: 'Name, configId, and updated metadata must be provided',
            });
        }
        return this.fileBucketService.updateBucket(request);
    }
}
