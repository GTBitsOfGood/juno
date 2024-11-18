import { Controller } from '@nestjs/common';
import { FileProviderProto } from 'juno-proto';
import { RpcException } from '@nestjs/microservices';
import { FileProviderDbServiceController } from 'juno-proto/dist/gen/file_provider';
import { FileProviderService } from './file_provider.service';

@Controller()
@FileProviderProto.FileProviderDbServiceControllerMethods()
export class FileProviderController implements FileProviderDbServiceController {
  constructor(private readonly fileProviderService: FileProviderService) {}
  async getProvider(
    request: FileProviderProto.GetFileProviderRequest,
  ): Promise<FileProviderProto.FileProvider> {
    if (!request.providerName || request.providerName === '') {
      throw new RpcException('Provider ID is invalid');
    }
    const fileProvider = await this.fileProviderService.getProvider(request);
    return fileProvider;
  }
  async createProvider(
    request: FileProviderProto.CreateFileProviderRequest,
  ): Promise<FileProviderProto.FileProvider> {
    if (!request.providerName || !request.accessKey || !request.metadata) {
      throw new RpcException('The given parameters are invalid!');
    }
    const fileProvider = await this.fileProviderService.createProvider(request);
    return fileProvider;
  }
  async deleteProvider(
    request: FileProviderProto.DeleteFileProviderRequest,
  ): Promise<FileProviderProto.FileProvider> {
    if (!request.providerName || request.providerName === '') {
      throw new RpcException('Provider ID is invalid');
    }
    const fileProvider = await this.fileProviderService.deleteProvider(request);
    return fileProvider;
  }
  async updateProvider(
    request: FileProviderProto.UpdateFileProviderRequest,
  ): Promise<FileProviderProto.FileProvider> {
    if (!request.providerName && !request.accessKey && !request.metadata) {
      throw new RpcException('You must update one of the attributes.');
    }
    const fileProvider = await this.fileProviderService.updateProvider(request);
    return fileProvider;
  }
}
