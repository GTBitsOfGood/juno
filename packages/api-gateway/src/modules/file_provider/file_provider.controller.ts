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
import { FileProviderProto } from 'juno-proto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  FileProviderResponse,
  RegisterFileProviderModel,
} from 'src/models/file_provider.dto';

const { FILE_PROVIDER_FILE_SERVICE_NAME } = FileProviderProto;

@ApiBearerAuth('api_key')
@ApiTags('file_provider')
@Controller('file')
export class FileProviderController implements OnModuleInit {
  private fileProviderService: FileProviderProto.FileProviderFileServiceClient;

  constructor(
    @Inject(FILE_PROVIDER_FILE_SERVICE_NAME)
    private fileProviderClient: ClientGrpc,
  ) {}

  onModuleInit() {
    this.fileProviderService =
      this.fileProviderClient.getService<FileProviderProto.FileProviderFileServiceClient>(
        FILE_PROVIDER_FILE_SERVICE_NAME,
      );
  }

  @Post('provider')
  @ApiOperation({ summary: 'Registers a File Provider.' })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Parameters are invalid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returned the file provider associated with the given data',
    type: FileProviderResponse,
  })
  async registerFileProvider(
    @Body('') params: RegisterFileProviderModel,
  ): Promise<FileProviderResponse> {
    console.log(`params: ${JSON.stringify(params)}`);

    const fileProvider = this.fileProviderService.registerProvider({
      baseUrl: params.baseUrl,
      providerName: params.providerName,
      privateAccessKey: params.accessKey.privateAccessKey,
      publicAccessKey: params.accessKey.publicAccessKey,
    });

    console.log(`provider: ${JSON.stringify(fileProvider)}`);

    return new FileProviderResponse(await lastValueFrom(fileProvider));
  }
}
