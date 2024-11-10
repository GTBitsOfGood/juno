import { Controller, Inject } from '@nestjs/common';
import { FileProto } from 'juno-proto';
import { ClientGrpc } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { RpcException } from '@nestjs/microservices';
import { GetObjectCommand, S3Client, getSignedUrl } from '@aws-sdk';

const { FILE_DB_SERVICE_NAME } = FileProto;

@Controller()
@FileProto.FileServiceControllerMethods()
export class FileController implements FileProto.FileServiceController {
    private fileService: FileProto.FileDbServiceClient;;

    constructor(@Inject(FILE_DB_SERVICE_NAME) private fileClient: ClientGrpc) { }

    onModuleInit() {
        this.fileService =
            this.fileClient.getService<FileProto.FileDbServiceClient>(
                FILE_DB_SERVICE_NAME,
            );
    }

    async downloadFile(
        request: FileProto.DownloadFileRequest,
    ): Promise<FileProto.DownloadFileResponse> {
        console.log(request);
        if (
            !request ||
            !request.fileName ||
            !request.data ||
            !request.bucket ||
            !request.provider
        ) {
            throw new RpcException({
                code: status.INVALID_ARGUMENT,
                message: 'Must provide filename, data, bucket, and provider'
            });
        }

        const metadata = request.data;
        const bucketJSON = JSON.parse(request.bucket);
        const bucketName = bucketJSON['name'];
        const configId = bucketJSON['configId'];
        const fileName = request.fileName
        if (configId == undefined || bucketName == undefined) {
            throw new RpcException({
                code: status.INVALID_ARGUMENT,
                message: 'ConfigId and bucketname must be provided',
            });
        }

        //Try connecting to s3 client
        const client = new S3Client(JSON.parse(request.data))

        //Create File
        const fileId = {
            bucketName: bucketName,
            configId: configId,
            path: fileName
        }
        await this.fileService.createFile(fileId, metadata)
        //get url
        const getcommand = new GetObjectCommand({
            Bucket: bucketName,
            Key: fileName
        })
        const expiration = 3600
        return await getSignedUrl(client, getcommand, expiration)
    }

    async uploadFile(
        request: FileProto.UploadFileRequest,
    ): Promise<FileProto.UploadFileResponse> {
        //replace with upload file
        return null
    }
}