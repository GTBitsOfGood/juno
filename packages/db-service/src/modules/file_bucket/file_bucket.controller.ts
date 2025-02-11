import { Controller } from '@nestjs/common';
import { FileBucketProto, IdentifierProto } from 'juno-proto';
import { RpcException } from '@nestjs/microservices';
import { BucketDbServiceController } from 'juno-proto/dist/gen/file_bucket';
import { FileBucketService } from './file_bucket.service';
import { status } from '@grpc/grpc-js';

@Controller()
@FileBucketProto.BucketDbServiceControllerMethods()
export class FileBucketController implements BucketDbServiceController {
  constructor(private readonly fileBucketService: FileBucketService) {}
  async getBucket(
    request: FileBucketProto.GetBucketRequest,
  ): Promise<FileBucketProto.Bucket> {
    if (!request.name || request.configId == undefined) {
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
      request.configId == undefined ||
      !request.fileProviderName ||
      request.configEnv == undefined
    ) {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message:
          'Name, configId, environment, file provider name, files, and metadata must be provided',
      });
    }
    type ResType = {
      name: string;
      configId: number;
      fileProviderName: string;
      configEnv: string;
      FileServiceFile?: Array<IdentifierProto.FileIdentifier>; // Include FileServiceFile as optional
    };
    //attach foreign keys to config, file provider, and fileservice file when we have access to foreign keys
    const res: ResType = await this.fileBucketService.createBucket(request);
    if (!res.FileServiceFile) {
      res.FileServiceFile = [];
    }

    return {
      name: res.name,
      configId: res.configId,
      configEnv: res.configEnv,
      fileProviderName: res.fileProviderName,
      FileServiceFile: res.FileServiceFile,
    } as FileBucketProto.Bucket;
  }
  async deleteBucket(
    request: FileBucketProto.DeleteBucketRequest,
  ): Promise<FileBucketProto.Bucket> {
    if (!request.name || request.configId == undefined || !request.configEnv) {
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
    if (
      !request.name ||
      request.configId == undefined ||
      !request.fileProviderName ||
      !request.configEnv
    ) {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: 'Name, configId, and updated metadata must be provided',
      });
    }
    return this.fileBucketService.updateBucket(request);
  }
}
