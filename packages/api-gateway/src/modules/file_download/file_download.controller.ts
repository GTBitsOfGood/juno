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
    DownloadFileModel,
    DownloadFileResponse,
} from 'src/models/file_download.dto';

const { FILE_SERVICE_NAME } = FileProto;

@ApiBearerAuth('api_key')
@ApiTags('file_download')
@Controller('file')
export class FileDownloadController implements OnModuleInit {
    private fileService: FileProto.FileServiceClient;

    constructor(
        @Inject(FILE_SERVICE_NAME)
        private fileClient: ClientGrpc,
    ) { }

    onModuleInit() {
        this.fileService =
            this.fileClient.getService<FileProto.FileServiceClient>(
                FILE_SERVICE_NAME,
            );
    }

    @Post('file')
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
        @Body('') params: DownloadFileModel,
    ): Promise<DownloadFileResponse> {
        const res = await lastValueFrom(this.fileService.downloadFile(params));

        return new DownloadFileResponse(res);
    }
}
