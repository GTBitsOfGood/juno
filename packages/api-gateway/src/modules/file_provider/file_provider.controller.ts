import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Inject,
  OnModuleInit,
  Param,
  Post,
} from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { FileProviderProto } from 'juno-proto';
import { lastValueFrom } from 'rxjs';
import {
  FileProvider,
  FileProviderPartial,
  RegisterFileProviderModel,
} from 'src/models/file_provider.dto';

const { FILE_PROVIDER_FILE_SERVICE_NAME, FILE_PROVIDER_DB_SERVICE_NAME } =
  FileProviderProto;

@ApiBearerAuth('API_Key')
@ApiTags('file_provider')
@Controller('file')
export class FileProviderController implements OnModuleInit {
  private fileProviderService: FileProviderProto.FileProviderFileServiceClient;
  private fileProviderDbService: FileProviderProto.FileProviderDbServiceClient;

  constructor(
    @Inject(FILE_PROVIDER_FILE_SERVICE_NAME)
    private fileProviderClient: ClientGrpc,
    @Inject(FILE_PROVIDER_DB_SERVICE_NAME)
    private fileProviderDbClient: ClientGrpc,
  ) {}

  onModuleInit() {
    this.fileProviderService =
      this.fileProviderClient.getService<FileProviderProto.FileProviderFileServiceClient>(
        FILE_PROVIDER_FILE_SERVICE_NAME,
      );
    this.fileProviderDbService =
      this.fileProviderDbClient.getService<FileProviderProto.FileProviderDbServiceClient>(
        FILE_PROVIDER_DB_SERVICE_NAME,
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
    type: FileProviderPartial,
  })
  async registerFileProvider(
    @Body('') params: RegisterFileProviderModel,
  ): Promise<FileProviderPartial> {
    let type: FileProviderProto.ProviderType;
    switch (params.type.toUpperCase()) {
      case 'S3':
        type = FileProviderProto.ProviderType.S3;
        break;
      case 'AZURE':
        type = FileProviderProto.ProviderType.AZURE;
        break;
      default:
        type = FileProviderProto.ProviderType.UNRECOGNIZED;
        break;
    }
    const fileProvider = this.fileProviderService.registerProvider({
      baseUrl: params.baseUrl,
      providerName: params.providerName,
      privateAccessKey: params.accessKey.privateAccessKey,
      publicAccessKey: params.accessKey.publicAccessKey,
      type: type,
    });

    return new FileProviderPartial(await lastValueFrom(fileProvider));
  }

  @Get('provider/all')
  @ApiOperation({ summary: 'Get All File Providers.' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiOkResponse({
    description: 'Returned all file providers',
    type: FileProvider,
    isArray: true,
  })
  async getAllFileProviders(): Promise<FileProvider[]> {
    const grpcResponse = this.fileProviderDbService.getAllProviders({});

    const providersData = await lastValueFrom(grpcResponse);

    return (
      providersData.providers?.map((provider) => new FileProvider(provider)) ??
      []
    );
  }

  @Delete('provider/:name')
  @ApiOperation({ summary: 'Delete File Provider.' })
  @ApiBadRequestResponse({ description: 'Parameters are invalid' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiOkResponse({
    description: 'Deleted and returned file provider with specified name',
    type: FileProviderPartial,
  })
  async deleteFileProvider(
    @Param('name') name: string,
  ): Promise<FileProviderPartial> {
    const grpcResponse = this.fileProviderService.removeProvider({
      providerName: name,
    });

    return new FileProviderPartial(await lastValueFrom(grpcResponse));
  }
}
