import {
  BadRequestException,
  Controller,
  Get,
  Inject,
  OnModuleInit,
  Param,
} from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthCommonProto, FileConfigProto } from 'juno-proto';
import { lastValueFrom } from 'rxjs';
import { ApiKey } from 'src/decorators/api_key.decorator';
import { FileConfigResponse } from 'src/models/file_config.dto';

const { FILE_SERVICE_CONFIG_DB_SERVICE_NAME } = FileConfigProto;

@ApiBearerAuth('api_key')
@ApiTags('file_config')
@Controller('file')
export class FileConfigController implements OnModuleInit {
  private fileConfigDBService: FileConfigProto.FileServiceConfigDbServiceClient;

  constructor(
    @Inject(FILE_SERVICE_CONFIG_DB_SERVICE_NAME)
    private fileConfigClient: ClientGrpc,
  ) {}

  onModuleInit() {
    this.fileConfigDBService =
      this.fileConfigClient.getService<FileConfigProto.FileServiceConfigDbServiceClient>(
        FILE_SERVICE_CONFIG_DB_SERVICE_NAME,
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
    if (Number.isNaN(id)) {
      throw new BadRequestException('Id must be a number');
    }

    const config = this.fileConfigDBService.getConfig({
      id: id,
      environment: apiKey.environment,
    });

    return new FileConfigResponse(await lastValueFrom(config));
  }
}
