import { Controller, Inject } from '@nestjs/common';
import { FileProto, FileProviderProto } from 'juno-proto';
import { ClientGrpc } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { RpcException } from '@nestjs/microservices';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { lastValueFrom } from 'rxjs';

const { FILE_DB_SERVICE_NAME } = FileProto;
const { FILE_PROVIDER_DB_SERVICE_NAME } = FileProviderProto;
@Controller()
@FileProto.FileServiceControllerMethods()
export class FileController implements FileProto.FileServiceController {
  private fileDBService: FileProto.FileDbServiceClient;
  private fileProviderDbService: FileProviderProto.FileProviderDbServiceClient;
  constructor(
    @Inject(FILE_DB_SERVICE_NAME) private fileDBClient: ClientGrpc,
    @Inject(FILE_PROVIDER_DB_SERVICE_NAME) private fileProviderClient: ClientGrpc,) { }

  onModuleInit() {
    this.fileDBService =
      this.fileDBClient.getService<FileProto.FileDbServiceClient>(
        FILE_DB_SERVICE_NAME,
      );
    this.fileProviderDbService =
      this.fileProviderClient.getService<FileProviderProto.FileProviderDbServiceClient>(FileProviderProto.FILE_PROVIDER_DB_SERVICE_NAME,
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
        message: 'Must provide filename, provider name, bucket name, and config id',
      });
    }

    const bucketName = request.bucketName;
    const configId = request.configId;
    const fileName = request.fileName;
    const providerName = request.providerName;
    const region = request.region ? request.region : 'us-east-1';

    //Try connecting to s3 client
    const provider = await lastValueFrom(this.fileProviderDbService.getProvider({
      providerName: providerName,
    }),
    );

    const metadata = {
      ...JSON.parse(provider['metadata']),
      region: region,
      credentials: JSON.parse(provider['accessKey']),
    };
    const client = new S3Client(metadata);

    //Get File
    const fileId = {
      bucketName: bucketName,
      configId: configId,
      path: fileName,
    };
    const fileRequest = { fileId };
    const file = await this.fileDBService.getFile(fileRequest);
    if (!file) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: 'File not found',
      });
    }

    //get url
    try {
      const getcommand = new GetObjectCommand({
        Bucket: bucketName,
        Key: fileName,
      });

      const url = await getSignedUrl(client, getcommand, { expiresIn: 3600 });

      return { url };

    } catch (err) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: 'Signed URL Not Found',
      });
    }
  }

  async uploadFile(
    request: FileProto.UploadFileRequest,
  ): Promise<FileProto.UploadFileResponse> {
    //replace with upload file functionality
    if (!request) {
      throw new RpcException({
        message: 'Must provide request',
      });
    }
    throw new RpcException({
      message: 'Upload File is not implemented',
    });
  }
}
