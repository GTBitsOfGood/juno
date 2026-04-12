import {
  Body,
  Controller,
  Delete,
  HttpStatus,
  Inject,
  OnModuleInit,
} from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { AuthCommonProto, FileProto } from 'juno-proto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  DeleteFilesModel,
  DeleteFilesResponse,
} from 'src/models/file_delete.dto';
import { ApiKey } from 'src/decorators/api_key.decorator';

const { FILE_SERVICE_NAME } = FileProto;

@ApiBearerAuth('API_Key')
@ApiTags('file_delete')
@Controller('file')
export class FileDeleteController implements OnModuleInit {
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

  @Delete('delete')
  @ApiOperation({ summary: 'Delete files from a bucket' })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Parameters are invalid',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Bucket or file not found',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns the bucket name and list of deleted file names',
    type: DeleteFilesResponse,
  })
  async deleteFiles(
    @ApiKey() apiKey: AuthCommonProto.ApiKey,
    @Body() params: DeleteFilesModel,
  ): Promise<DeleteFilesResponse> {
    const res = await lastValueFrom(
      this.fileService.deleteFiles({
        bucketName: params.bucketName,
        configId: params.configId,
        configEnv: apiKey.environment,
        fileNames: params.fileNames,
      }),
    );

    return new DeleteFilesResponse(res);
  }
}
