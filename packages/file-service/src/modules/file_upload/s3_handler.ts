import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import { FileProto, FileProviderProto } from 'juno-proto';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { lastValueFrom } from 'rxjs';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export class S3FileHandler {
  constructor(
    private fileDBService: FileProto.FileDbServiceClient,
    private provider: FileProviderProto.FileProvider,
  ) {}

  async getS3Client(region: string): Promise<S3Client> {
    try {
      const metadata = {
        ...JSON.parse(this.provider.metadata),
        region: region,
        credentials: JSON.parse(this.provider.accessKey),
      };
      return new S3Client(metadata);
    } catch (error) {
      throw new RpcException({
        code: status.FAILED_PRECONDITION,
        message: `Failed to initialize S3 client: ${error.message} `,
      });
    }
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

    //get url
    try {
      const client = await this.getS3Client('us-east-005');
      const getcommand = new GetObjectCommand({
        Bucket: request.bucketName,
        Key: request.fileName,
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
    let url = '';
    try {
      const s3Client = await this.getS3Client('us-east-005');
      const command = new PutObjectCommand({
        Bucket: request.bucketName,
        Key: request.fileName,
      });
      url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    } catch (err) {
      throw new RpcException({
        code: status.FAILED_PRECONDITION,
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
