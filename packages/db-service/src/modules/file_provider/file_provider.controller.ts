import { Controller } from '@nestjs/common';
import { IdentifierProto, FileProviderProto } from 'juno-proto';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { FileProviderDbServiceController } from 'juno-proto/dist/gen/file_provider';
import { Observable } from 'rxjs';
import { FileProviderService } from './file_provider.service';

@Controller()
@FileProviderProto.FileProviderDbServiceControllerMethods()
export class FileProviderController implements FileProviderDbServiceController {
  constructor(private readonly fileProviderService: FileProviderService) {}
  getProvider(
    request: FileProviderProto.GetFileProviderRequest,
  ):
    | Promise<FileProviderProto.FileProvider>
    | Observable<FileProviderProto.FileProvider>
    | FileProviderProto.FileProvider {
    throw new Error('Method not implemented.');
  }
  createProvider(
    request: FileProviderProto.CreateFileProviderRequest,
  ):
    | Promise<FileProviderProto.FileProvider>
    | Observable<FileProviderProto.FileProvider>
    | FileProviderProto.FileProvider {
    throw new Error('Method not implemented.');
  }
  deleteProvider(
    request: FileProviderProto.DeleteFileProviderRequest,
  ):
    | Promise<FileProviderProto.FileProvider>
    | Observable<FileProviderProto.FileProvider>
    | FileProviderProto.FileProvider {
    throw new Error('Method not implemented.');
  }
  updateProvider(
    request: FileProviderProto.UpdateFileProviderRequest,
  ):
    | Promise<FileProviderProto.FileProvider>
    | Observable<FileProviderProto.FileProvider>
    | FileProviderProto.FileProvider {
    throw new Error('Method not implemented.');
  }
}
