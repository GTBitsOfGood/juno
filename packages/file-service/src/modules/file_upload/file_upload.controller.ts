import { Controller, Inject } from '@nestjs/common';
import { FileProto, FileProviderProto } from 'juno-proto';
import { FileServiceController } from 'juno-proto/dist/gen/file';
import { ClientGrpc } from '@nestjs/microservices';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { lastValueFrom } from 'rxjs';
import { S3FileHandler } from './s3_handler';

const { FILE_DB_SERVICE_NAME } = FileProto;
const { FILE_PROVIDER_DB_SERVICE_NAME } = FileProviderProto;

@Controller()
@FileProto.FileServiceControllerMethods()
export class FileUploadController implements FileServiceController {
  private fileDBService: FileProto.FileDbServiceClient;
  private fileProviderDbService: FileProviderProto.FileProviderDbServiceClient;

  constructor(
    @Inject(FILE_DB_SERVICE_NAME) private fileDBClient: ClientGrpc,
    @Inject(FILE_PROVIDER_DB_SERVICE_NAME)
    private fileProviderClient: ClientGrpc,
  ) {}

  onModuleInit() {
    this.fileDBService =
      this.fileDBClient.getService<FileProto.FileDbServiceClient>(
        FILE_DB_SERVICE_NAME,
      );
    this.fileProviderDbService =
      this.fileProviderClient.getService<FileProviderProto.FileProviderDbServiceClient>(
        FileProviderProto.FILE_PROVIDER_DB_SERVICE_NAME,
      );
  }

  async downloadFile(
    request: FileProto.DownloadFileRequest,
  ): Promise<FileProto.DownloadFileResponse> {
    if (
      !request ||
      !request.fileName ||
      !request.bucketName ||
      !request.providerName ||
      request.configId == undefined
    ) {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message:
          'Must provide filename, provider name, bucket name, and config id',
      });
    }

    try {
      const provider = await lastValueFrom(
        this.fileProviderDbService.getProvider({
          providerName: request.providerName,
        }),
      );

      switch (provider.providerType) {
        case FileProviderProto.ProviderType.S3: {
          const handler = new S3FileHandler(this.fileDBService, provider);
          return handler.downloadFile(request);
        }
        default: {
          throw new RpcException({
            code: status.FAILED_PRECONDITION,
            message: 'Provider type not supported',
          });
        }
      }
    } catch (err) {
      if (err instanceof RpcException) {
        throw err;
      }
      throw new RpcException({
        code: err.code ?? status.INTERNAL,
        message: `Unknown error occurred: ${err}`,
      });
    }
  }

  async uploadFile(
    request: FileProto.UploadFileRequest,
  ): Promise<FileProto.UploadFileResponse> {
    if (
      !request ||
      !request.bucketName ||
      request.bucketName == '' ||
      !request.fileName ||
      request.fileName == '' ||
      !request.providerName ||
      request.providerName == '' ||
      request.configId == undefined ||
      (request.region && request.region == '')
    ) {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message:
          'bucketName, fileName, configId, and providerName must all be passed in and not empty strings',
      });
    }

    try {
      const provider = await lastValueFrom(
        this.fileProviderDbService.getProvider({
          providerName: request.providerName,
        }),
      );

      switch (provider.providerType) {
        case FileProviderProto.ProviderType.S3: {
          const handler = new S3FileHandler(this.fileDBService, provider);
          return handler.uploadFile(request);
        }
        default: {
          throw new RpcException({
            code: status.FAILED_PRECONDITION,
            message: 'Provider type not supported',
          });
        }
      }
    } catch (e) {
      if (e instanceof RpcException) {
        throw e;
      }
      throw new RpcException({
        code: e.code ?? status.INTERNAL,
        message: `Unknown error occurred: ${e}`,
      });
    }
  }
}
