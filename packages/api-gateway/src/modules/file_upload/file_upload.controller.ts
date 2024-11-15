import {
  Body,
  Controller,
  HttpStatus,
  Inject,
  OnModuleInit,
  Post,
} from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { FileProto } from 'juno-proto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  UploadFileResponse,
  UploadFileModel,
} from 'src/models/file_upload.dto';

const { FILE_SERVICE_NAME } = FileProto;

@ApiBearerAuth('api_key')
@ApiTags('file_upload')
@Controller('file')
export class FileUploadController implements OnModuleInit {
  private fileService: FileProto.FileServiceClient;

  constructor(
    @Inject(FILE_SERVICE_NAME)
    private fileClient: ClientGrpc,
  ) {}

  onModuleInit() {
    this.fileService =
      this.fileClient.getService<FileProto.FileServiceClient>(
        FILE_SERVICE_NAME,
      );
  }

  @Post('/upload')
  @ApiOperation({
    summary: `Upload a file to a File Storage Provider's Bucket`,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Parameters are invalid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returned the pre-signed URL used for file uploading',
    type: UploadFileResponse,
  })
  async uploadFile(
    @Body('') params: UploadFileModel,
  ): Promise<UploadFileResponse> {
    const uploadFile = this.fileService.uploadFile({
      fileName: params.fileName,
      bucketName: params.bucketName,
      providerName: params.providerName,
      configId: params.configId,
      region: params.region,
    });

    return new UploadFileResponse(await lastValueFrom(uploadFile));
  }
}
