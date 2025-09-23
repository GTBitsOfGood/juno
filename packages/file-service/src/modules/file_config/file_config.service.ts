import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { ClientGrpc, RpcException } from '@nestjs/microservices';
import { FileConfigProto } from 'juno-proto';
import { lastValueFrom } from 'rxjs';
import { status } from '@grpc/grpc-js';

@Injectable()
export class FileConfigService implements OnModuleInit {
  private fileConfigDbService: FileConfigProto.FileServiceConfigDbServiceClient;
  constructor(
    @Inject(FileConfigProto.FILE_SERVICE_CONFIG_DB_SERVICE_NAME)
    private fileDBClient: ClientGrpc,
  ) {}

  onModuleInit() {
    this.fileConfigDbService =
      this.fileDBClient.getService<FileConfigProto.FileServiceConfigDbServiceClient>(
        FileConfigProto.FILE_SERVICE_CONFIG_DB_SERVICE_NAME,
      );
  }

  async setup(
    request: FileConfigProto.SetupRequest,
  ): Promise<FileConfigProto.SetupResponse> {
    const config = await lastValueFrom(
      this.fileConfigDbService.createConfig({
        projectId: request.projectId,
        environment: request.environment,
        buckets: [],
        files: [],
      }),
    );

    if (!config) {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: 'Failed to create file service config',
      });
    }

    return {
      success: true,
      config,
    };
  }
}
