import { Controller, Inject } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { FileProviderProto } from 'juno-proto';
import { FileProviderFileServiceController } from 'juno-proto/dist/gen/file_provider';
import { Observable } from 'rxjs';

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

  registerProvider(
    request: FileProviderProto.RegisterProviderRequest,
  ): Observable<FileProviderProto.FileProvider> {
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
    const fileProvider = this.fileProviderDbService.createProvider({
      accessKey: request.accessKey,
      providerName: request.providerName,
      metadata: request.baseUrl,
      bucket: [],
    });

    return fileProvider;
  }
  removeProvider(
    request: FileProviderProto.RemoveProviderRequest,
  ): Observable<FileProviderProto.FileProvider> {
    if (!request.providerName || request.providerName === '') {
      throw new Error('Your provider name is invalid.');
    }
    const fileProvider = this.fileProviderDbService.deleteProvider({
      providerName: request.providerName,
    });

    return fileProvider;
  }
}
