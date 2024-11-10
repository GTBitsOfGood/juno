import { Controller, Inject } from '@nestjs/common';
import { FileProto, FileProviderProto } from 'juno-proto';
import { FileServiceController } from 'juno-proto/dist/gen/file';
import { ClientGrpc } from '@nestjs/microservices';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { lastValueFrom } from 'rxjs';

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
    console.log(request);
    throw new Error('Not implemented');
  }

  async uploadFile(
    request: FileProto.UploadFileRequest,
  ): Promise<FileProto.UploadFileResponse> {
    if (
      !request ||
      !request.bucketName ||
      request.bucketName == '' ||
      !request.data ||
      request.data == '' ||
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
          'bucketName, data, fileName, configId, and providerName must all be passed in and not empty strings',
      });
    }

    const region = request.region ? request.region : 'us-east-1';

    const provider = await lastValueFrom(
      this.fileProviderDbService.getProvider({
        providerName: request.providerName,
      }),
    );
    const accessKey = provider['accessKey'];
    const metadata = {
      ...JSON.parse(provider['metadata']),
      region: region,
      credentials: JSON.parse(accessKey),
    };

    const s3Client = new S3Client(metadata);
    const command = new PutObjectCommand({
      Bucket: request.bucketName,
      Key: request.fileName,
    });
    const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

    // Save file to DB
    await lastValueFrom(
      this.fileDBService.createFile({
        fileId: {
          bucketName: request.bucketName,
          configId: request.configId,
          path: request.fileName,
        },
        metadata: '',
      }),
    );

    return { url: url };
  }
}
