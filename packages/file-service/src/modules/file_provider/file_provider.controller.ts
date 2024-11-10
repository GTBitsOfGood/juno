import { Controller, Inject } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { FileProviderProto } from 'juno-proto';
import { FileProviderFileServiceController } from 'juno-proto/dist/gen/file_provider';
import { lastValueFrom } from 'rxjs';

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

  async registerProvider(
    request: FileProviderProto.RegisterProviderRequest,
  ): Promise<FileProviderProto.FileProvider> {
    if (
      !request.accessKey ||
      request.accessKey === '' ||
      !request.baseUrl ||
      request.baseUrl === '' ||
      !request.providerName ||
      request.providerName === ''
    ) {
      throw new Error('Your input parameters are invalid.');
    }
    const fileProviderRequest = this.fileProviderDbService.createProvider({
      accessKey: request.accessKey,
      providerName: request.providerName,
      metadata: request.baseUrl,
      bucket: [],
    });

    const fileProvider = lastValueFrom(fileProviderRequest);

    return fileProvider;
  }
  removeProvider(
    request: FileProviderProto.RemoveProviderRequest,
  ): Promise<FileProviderProto.FileProvider> {
    if (!request.providerName || request.providerName === '') {
      throw new Error('Your provider name is invalid.');
    }

    const fileProviderRequest = this.fileProviderDbService.deleteProvider({
      providerName: request.providerName,
    });

    const fileProvider = lastValueFrom(fileProviderRequest);

    return fileProvider;
  }
}
