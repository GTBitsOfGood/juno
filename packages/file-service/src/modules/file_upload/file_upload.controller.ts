import { Controller, Inject } from '@nestjs/common';
import { FileProto } from 'juno-proto';
import { FileServiceController } from 'juno-proto/dist/gen/file';
import { ClientGrpc } from '@nestjs/microservices';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { lastValueFrom } from 'rxjs';

const { FILE_DB_SERVICE_NAME } = FileProto;

@Controller()
@FileProto.FileServiceControllerMethods()
export class FileUploadController implements FileServiceController {
  private fileDBService: FileProto.FileDbServiceClient;

  constructor(@Inject(FILE_DB_SERVICE_NAME) private fileDBClient: ClientGrpc) {}

  onModuleInit() {
    this.fileDBService =
      this.fileDBClient.getService<FileProto.FileDbServiceClient>(
        FILE_DB_SERVICE_NAME,
      );
  }

  async downloadFile(
    request: FileProto.DownloadFileRequest,
  ): Promise<FileProto.DownloadFileResponse> {
    console.log(request);
    throw new Error('Not implemented');
  }

  async uploadFile(
    request: FileProto.UploadFileRequest,
  ): Promise<FileProto.UploadFileResponse> {
    if (
      !request ||
      !request.bucket ||
      request.bucket == '' ||
      !request.data ||
      request.data == '' ||
      !request.fileName ||
      request.fileName == '' ||
      !request.provider ||
      request.provider == ''
    ) {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message:
          'bucketName, data, fileName, and provider must all be passed in and not empty strings',
      });
    }

    const providerJson = JSON.parse(request.provider);
    const bucketJson = JSON.parse(request.bucket);
    const metadata = providerJson['metadata'];
    const accessKey = providerJson['accessKey'];
    const bucketName = bucketJson['name'];
    const configId = bucketJson['configId'];

    if (!metadata || metadata == '') {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: 'metadata is not in provider or is empty string',
      });
    }

    if (!accessKey || accessKey == '') {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: 'accessKey is not in provider or is empty string',
      });
    }

    if (!bucketName || bucketName == '') {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: 'bucketName is not in bucket or is empty string',
      });
    }

    if (configId == undefined) {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: 'configId is not in bucket',
      });
    }

    const s3Client = new S3Client(JSON.parse(metadata));
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: accessKey,
    });
    const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

    // Save file to DB
    await lastValueFrom(
      this.fileDBService.createFile({
        fileId: {
          bucketName: bucketName,
          configId: configId,
          path: request.fileName,
        },
        metadata: metadata,
      }),
    );

    return { url: url };
  }
}
