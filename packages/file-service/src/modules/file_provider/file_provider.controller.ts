import { Controller, Inject } from '@nestjs/common';
import { ClientGrpc, RpcException } from '@nestjs/microservices';
import { FileProviderProto } from 'juno-proto';
import { FileProviderFileServiceController } from 'juno-proto/dist/gen/file_provider';
import { lastValueFrom } from 'rxjs';
import { status } from '@grpc/grpc-js';

@Controller()
@FileProviderProto.FileProviderFileServiceControllerMethods()
export class FileProviderController
  implements FileProviderFileServiceController
{
  private fileProviderDbService: FileProviderProto.FileProviderDbServiceClient;
  constructor(
    @Inject(FileProviderProto.FILE_PROVIDER_DB_SERVICE_NAME)
    private fileProviderClient: ClientGrpc,
  ) {}

  onModuleInit() {
    this.fileProviderDbService =
      this.fileProviderClient.getService<FileProviderProto.FileProviderDbServiceClient>(
        FileProviderProto.FILE_PROVIDER_DB_SERVICE_NAME,
      );
  }

  async getAccessKey(
    request: FileProviderProto.RegisterProviderRequest,
  ): Promise<string> {
    switch (request.type) {
      case FileProviderProto.ProviderType.S3:
        return JSON.stringify({
          accessKeyId: request.publicAccessKey,
          secretAccessKey: request.privateAccessKey,
        });
      case FileProviderProto.ProviderType.AZURE:
        return JSON.stringify({
          accountName: request.publicAccessKey,
          accountKey: request.privateAccessKey,
        });
      default:
        throw new RpcException({
          code: status.INVALID_ARGUMENT,
          message: 'Invalid argument',
        });
    }
  }

  async registerProvider(
    request: FileProviderProto.RegisterProviderRequest,
  ): Promise<FileProviderProto.FileProvider> {
    if (
      !request.publicAccessKey ||
      request.publicAccessKey === '' ||
      !request.privateAccessKey ||
      request.privateAccessKey === '' ||
      !request.baseUrl ||
      request.baseUrl === '' ||
      !request.providerName ||
      request.providerName === '' ||
      !request.configEnv
    ) {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: 'Invalid argument',
      });
    }

    try {
      const fileProviderRequest = this.fileProviderDbService.createProvider({
        accessKey: await this.getAccessKey(request),
        providerName: request.providerName,
        metadata: JSON.stringify({ endpoint: request.baseUrl }),
        type: request.type,
        bucket: [],
        configId: request.configId,
        configEnv: request.configEnv,
      });

      return await lastValueFrom(fileProviderRequest);
    } catch (error) {
      throw new RpcException({
        code: status.FAILED_PRECONDITION,
        message: error.details ?? error.message,
      });
    }
  }
  removeProvider(
    request: FileProviderProto.RemoveProviderRequest,
  ): Promise<FileProviderProto.FileProvider> {
    if (
      !request.providerName ||
      request.providerName === '' ||
      !request.configEnv
    ) {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: 'Invalid argument',
      });
    }

    const fileProviderRequest = this.fileProviderDbService.deleteProvider({
      providerName: request.providerName,
      configId: request.configId,
      configEnv: request.configEnv,
    });

    const fileProvider = lastValueFrom(fileProviderRequest);

    return fileProvider;
  }

  getProvidersByConfigId(
    request: FileProviderProto.GetFileProvidersByConfigIdRequest,
  ): Promise<FileProviderProto.FileProviders> {
    if (request.configId === undefined || !request.configEnv) {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: 'configId and configEnv must be provided',
      });
    }

    return lastValueFrom(
      this.fileProviderDbService.getProvidersByConfigId({
        configId: request.configId,
        configEnv: request.configEnv,
      }),
    );
  }
}
