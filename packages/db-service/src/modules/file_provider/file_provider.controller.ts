import { status } from '@grpc/grpc-js';
import { Controller } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { FileProviderProto } from 'juno-proto';
import { FileProviderDbServiceController } from 'juno-proto/dist/gen/file_provider';
import { FileProviderService } from './file_provider.service';

// Every provider lookup is scoped to the file config that owns it.
function validateConfig(request: { configId?: number; configEnv?: string }) {
  if (
    request.configId === undefined ||
    request.configId === null ||
    Number.isNaN(Number(request.configId)) ||
    Number(request.configId) < 0 ||
    !request.configEnv ||
    request.configEnv.trim() === ''
  ) {
    throw new RpcException({
      code: status.INVALID_ARGUMENT,
      message: 'configId and configEnv must be provided',
    });
  }
}

function validateProviderName(providerName?: string) {
  if (!providerName || providerName.trim() === '') {
    throw new RpcException({
      code: status.INVALID_ARGUMENT,
      message: 'Provider name is invalid',
    });
  }
}

@Controller()
@FileProviderProto.FileProviderDbServiceControllerMethods()
export class FileProviderController implements FileProviderDbServiceController {
  constructor(private readonly fileProviderService: FileProviderService) {}

  async getProvider(
    request: FileProviderProto.GetFileProviderRequest,
  ): Promise<FileProviderProto.FileProvider> {
    validateProviderName(request.providerName);
    validateConfig(request);
    return await this.fileProviderService.getProvider(request);
  }

  async getAllProviders(): Promise<FileProviderProto.FileProviders> {
    return await this.fileProviderService.getAllProviders();
  }

  async getProvidersByConfigId(
    request: FileProviderProto.GetFileProvidersByConfigIdRequest,
  ): Promise<FileProviderProto.FileProviders> {
    validateConfig(request);
    return await this.fileProviderService.getProvidersByConfigId(request);
  }

  async createProvider(
    request: FileProviderProto.CreateFileProviderRequest,
  ): Promise<FileProviderProto.FileProvider> {
    if (!request.providerName || !request.accessKey || !request.metadata) {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: 'Provider name, access key, or metadata are invalid',
      });
    }
    validateConfig(request);
    return await this.fileProviderService.createProvider(request);
  }

  async deleteProvider(
    request: FileProviderProto.DeleteFileProviderRequest,
  ): Promise<FileProviderProto.FileProvider> {
    validateProviderName(request.providerName);
    validateConfig(request);
    return await this.fileProviderService.deleteProvider(request);
  }

  async updateProvider(
    request: FileProviderProto.UpdateFileProviderRequest,
  ): Promise<FileProviderProto.FileProvider> {
    validateProviderName(request.providerName);
    validateConfig(request);
    if (!request.accessKey && !request.metadata && request.type === undefined) {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: 'You must update one of the attributes',
      });
    }
    return await this.fileProviderService.updateProvider(request);
  }
}
