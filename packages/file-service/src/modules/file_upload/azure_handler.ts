import { FileProto, FileProviderProto } from 'juno-proto';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { lastValueFrom } from 'rxjs';
import {
  BlobSASPermissions,
  generateBlobSASQueryParameters,
  StorageSharedKeyCredential,
} from '@azure/storage-blob';

export class AzureFileHandler {
  constructor(
    private fileDBService: FileProto.FileDbServiceClient,
    private provider: FileProviderProto.FileProvider,
  ) {}

  async getSharedKeyCredential(): Promise<StorageSharedKeyCredential> {
    const accessKeyPayload = JSON.parse(this.provider.accessKey);
    if (!accessKeyPayload.account || !accessKeyPayload.accountKey) {
      throw new RpcException({
        code: status.FAILED_PRECONDITION,
        message: 'Invalid access key payload',
      });
    }
    const account = accessKeyPayload.account;
    const accountKey = accessKeyPayload.accountKey;

    return new StorageSharedKeyCredential(account, accountKey);
  }

  async downloadFile(
    request: FileProto.DownloadFileRequest,
  ): Promise<FileProto.DownloadFileResponse> {
    try {
      //Get File
      const fileId = {
        bucketName: request.bucketName,
        configId: request.configId,
        path: request.fileName,
        configEnv: request.configEnv,
      };
      const fileRequest = { fileId };
      const file = await lastValueFrom(this.fileDBService.getFile(fileRequest));
      if (!file) {
        throw new RpcException({
          code: status.NOT_FOUND,
          message: 'File not found',
        });
      }
    } catch (e) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: `File not found: ${e}`,
      });
    }

    const sharedKeyCredential = await this.getSharedKeyCredential();
    //get url
    try {
      const blobSAS = generateBlobSASQueryParameters(
        {
          containerName: request.bucketName, // Required
          blobName: request.fileName, // Required
          permissions: BlobSASPermissions.from({
            read: true,
          }), // Required
          startsOn: new Date(), // Required
          expiresOn: new Date(new Date().valueOf() + 86400), // Optional. Date type
        },
        sharedKeyCredential, // StorageSharedKeyCredential - `new StorageSharedKeyCredential(account, accountKey)`
      ).toString();

      return { url: blobSAS };
    } catch (err) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: `Signed URL Not Found: ${err}`,
      });
    }
  }

  async uploadFile(
    request: FileProto.UploadFileRequest,
  ): Promise<FileProto.UploadFileResponse> {
    const sharedKeyCredential = await this.getSharedKeyCredential();
    let url = '';
    try {
      const blobSAS = generateBlobSASQueryParameters(
        {
          containerName: request.bucketName, // Required
          blobName: request.fileName, // Required
          permissions: BlobSASPermissions.from({
            read: true,
          }), // Required
          startsOn: new Date(), // Required
          expiresOn: new Date(new Date().valueOf() + 86400), // Optional. Date type
        },
        sharedKeyCredential, // StorageSharedKeyCredential - `new StorageSharedKeyCredential(account, accountKey)`
      ).toString();

      url = blobSAS;
    } catch (err) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: `Signed URL Not Found: ${err}`,
      });
    }
    try {
      // Save file to DB
      await lastValueFrom(
        this.fileDBService.createFile({
          fileId: {
            bucketName: request.bucketName,
            configId: request.configId,
            path: request.fileName,
            configEnv: request.configEnv,
          },
          metadata: '',
        }),
      );
    } catch (e) {
      throw new RpcException({
        code: e.code ?? status.FAILED_PRECONDITION,
        message: `Could not save file to database: ${e}`,
      });
    }

    return { url: url };
  }
}
