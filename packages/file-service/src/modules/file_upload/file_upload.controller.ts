import { Controller, Inject } from '@nestjs/common';
import { FileProto, FileProviderProto } from 'juno-proto';
import { FileServiceController } from 'juno-proto/dist/gen/file';
import { ClientGrpc } from '@nestjs/microservices';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { lastValueFrom, firstValueFrom } from 'rxjs';

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

    const bucketName = request.bucketName;
    const configId = request.configId;
    const fileName = request.fileName;
    const providerName = request.providerName;
    const region = request.region ? request.region : 'us-east-1';
    const configEnv = request.configEnv;

    //Try connecting to s3 client

    try {
      //Get File
      const fileId = {
        bucketName: bucketName,
        configId: configId,
        path: fileName,
        configEnv: configEnv,
      };
      const fileRequest = { fileId };
      const file = await firstValueFrom(
        this.fileDBService.getFile(fileRequest),
      );
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

    //get url
    try {
      const provider = await lastValueFrom(
        this.fileProviderDbService.getProvider({
          providerName: providerName,
        }),
      );

      const metadata = {
        ...JSON.parse(provider['metadata']),
        region: region,
        credentials: JSON.parse(provider['accessKey']),
      };
      const client = new S3Client(metadata);
      const getcommand = new GetObjectCommand({
        Bucket: bucketName,
        Key: fileName,
      });

      const url = await getSignedUrl(client, getcommand, { expiresIn: 3600 });

      return { url };
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

    let url = '';
    try {
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
      url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    } catch (err) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: `Could not create signed url: ${err}`,
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
