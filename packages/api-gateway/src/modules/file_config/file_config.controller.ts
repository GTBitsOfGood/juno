import {
  BadRequestException,
  Controller,
  Get,
  Inject,
  OnModuleInit,
  Param,
  Post,
} from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthCommonProto, FileConfigProto } from 'juno-proto';
import { lastValueFrom } from 'rxjs';
import { ApiKey } from 'src/decorators/api_key.decorator';
import {
  FileConfigResponse,
  SetupFileServiceResponse,
} from 'src/models/file_config.dto';

const {
  FILE_SERVICE_CONFIG_DB_SERVICE_NAME,
  FILE_SERVICE_CONFIG_SERVICE_NAME,
} = FileConfigProto;

@ApiBearerAuth('api_key')
@ApiTags('file_config')
@Controller('file')
export class FileConfigController implements OnModuleInit {
  private fileConfigService: FileConfigProto.FileServiceConfigServiceClient;
  private fileConfigDBService: FileConfigProto.FileServiceConfigDbServiceClient;

  constructor(
    @Inject(FILE_SERVICE_CONFIG_DB_SERVICE_NAME)
    private fileConfigDbClient: ClientGrpc,
    @Inject(FILE_SERVICE_CONFIG_SERVICE_NAME)
    private fileConfigClient: ClientGrpc,
  ) {}

  onModuleInit() {
    this.fileConfigDBService =
      this.fileConfigDbClient.getService<FileConfigProto.FileServiceConfigDbServiceClient>(
        FILE_SERVICE_CONFIG_DB_SERVICE_NAME,
      );
    this.fileConfigService =
      this.fileConfigClient.getService<FileConfigProto.FileServiceConfigServiceClient>(
        FILE_SERVICE_CONFIG_SERVICE_NAME,
      );
  }

  @Get('config/:projectId')
  @ApiOperation({ summary: 'Get file configuration by project ID' })
  @ApiBadRequestResponse({
    description: 'Parameters are invalid',
  })
  @ApiNotFoundResponse({
    description: 'No file config with specified project ID was found',
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid API key provided',
  })
  @ApiOkResponse({
    description:
      'Returned the file config associated with the specified project ID',
    type: FileConfigResponse,
  })
  async getFileConfigByProjectId(
    @ApiKey() apiKey: AuthCommonProto.ApiKey,
    @Param('projectId') projectId: string,
  ): Promise<FileConfigResponse> {
    const id = parseInt(projectId);
    if (Number.isNaN(id) || id < 0) {
      throw new BadRequestException(
        'Id must be an int greater than or equal to 0',
      );
    }

    const config = this.fileConfigDBService.getConfig({
      id: id,
      environment: apiKey.environment,
    });

    return new FileConfigResponse(await lastValueFrom(config));
  }

  @ApiOperation({
    summary: 'Sets up file services for the Project/Environmenr',
  })
  @ApiCreatedResponse({
    description: 'File Services setup successfully',
    type: SetupFileServiceResponse,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiBadRequestResponse({ description: 'Bad Request' })
  @Post('config/setup')
  async setup(
    @ApiKey() apiKey: AuthCommonProto.ApiKey,
  ): Promise<SetupFileServiceResponse> {
    const setupResponse = await lastValueFrom(
      this.fileConfigService.setup({
        projectId: apiKey.project.id,
        environment: apiKey.environment,
      }),
    );

    return new SetupFileServiceResponse(setupResponse);
  }
}
