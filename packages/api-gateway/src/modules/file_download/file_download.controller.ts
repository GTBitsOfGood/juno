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
import { AuthCommonProto, FileProto } from 'juno-proto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  DownloadFileModel,
  DownloadFileResponse,
} from 'src/models/file_download.dto';
import { ApiKey } from 'src/decorators/api_key.decorator';

const { FILE_SERVICE_NAME } = FileProto;

@ApiBearerAuth('API_Key')
@ApiTags('file_download')
@Controller('file')
export class FileDownloadController implements OnModuleInit {
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

  @Post('download')
  @ApiOperation({ summary: 'Downloads a file' })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Parameters are invalid',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Cannot find file to use for downloading',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returned the url for file download',
    type: DownloadFileResponse,
  })
  async downloadFile(
    @ApiKey() apiKey: AuthCommonProto.ApiKey,
    @Body('') params: DownloadFileModel,
  ): Promise<DownloadFileResponse> {
    const res = await lastValueFrom(
      this.fileService.downloadFile({
        configEnv: apiKey.environment,
        ...params,
      }),
    );

    return new DownloadFileResponse(res);
  }
}
