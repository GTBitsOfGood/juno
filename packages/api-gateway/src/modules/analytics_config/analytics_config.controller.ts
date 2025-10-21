import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  Inject,
  OnModuleInit,
  Param,
  Post,
  Put,
  Body,
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
import { AuthCommonProto, AnalyticsConfigProto } from 'juno-proto';
import { lastValueFrom } from 'rxjs';
import { ApiKey } from 'src/decorators/api_key.decorator';
import {
  AnalyticsConfigResponse,
  CreateAnalyticsConfigModel,
  UpdateAnalyticsConfigModel,
} from 'src/models/analytics_config.dto';

const { ANALYTICS_CONFIG_DB_SERVICE_NAME } = AnalyticsConfigProto;

@ApiBearerAuth('API_Key')
@ApiTags('analytics_config')
@Controller('analytics/config')
export class AnalyticsConfigController implements OnModuleInit {
  private analyticsConfigDbService: AnalyticsConfigProto.AnalyticsConfigDbServiceClient;

  constructor(
    @Inject(ANALYTICS_CONFIG_DB_SERVICE_NAME)
    private analyticsConfigDbClient: ClientGrpc,
  ) {}

  onModuleInit() {
    this.analyticsConfigDbService =
      this.analyticsConfigDbClient.getService<AnalyticsConfigProto.AnalyticsConfigDbServiceClient>(
        ANALYTICS_CONFIG_DB_SERVICE_NAME,
      );
  }

  @Post()
  @ApiOperation({ summary: 'Create analytics configuration' })
  @ApiCreatedResponse({
    description: 'Analytics configuration created successfully',
    type: AnalyticsConfigResponse,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiBadRequestResponse({ description: 'Bad Request' })
  async createAnalyticsConfig(
    @ApiKey() apiKey: AuthCommonProto.ApiKey,
    @Body() request: CreateAnalyticsConfigModel,
  ): Promise<AnalyticsConfigResponse> {
    const response = await lastValueFrom(
      this.analyticsConfigDbService.createAnalyticsConfig({
        projectId: apiKey.project.id,
        environment: apiKey.environment,
        analyticsKey: request.analyticsKey,
      }),
    );
    return new AnalyticsConfigResponse(response);
  }

  @Get(':projectId')
  @ApiOperation({ summary: 'Get analytics configuration' })
  @ApiOkResponse({
    description: 'Analytics configuration retrieved successfully',
    type: AnalyticsConfigResponse,
  })
  @ApiNotFoundResponse({
    description: 'Analytics configuration not found',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiBadRequestResponse({ description: 'Bad Request' })
  async getAnalyticsConfig(
    @ApiKey() apiKey: AuthCommonProto.ApiKey,
    @Param('projectId') projectId: string,
  ): Promise<AnalyticsConfigResponse> {
    const id = parseInt(projectId);

    if (Number.isNaN(id) || id < 0) {
      throw new BadRequestException('Project ID must be a valid integer');
    }

    const config = await lastValueFrom(
      this.analyticsConfigDbService.readAnalyticsConfig({
        id: id,
        environment: apiKey.environment,
      }),
    );
    return new AnalyticsConfigResponse(config);
  }

  @Put(':projectId')
  @ApiOperation({ summary: 'Update analytics configuration' })
  @ApiOkResponse({
    description: 'Analytics configuration updated successfully',
    type: AnalyticsConfigResponse,
  })
  @ApiNotFoundResponse({
    description: 'Analytics configuration not found',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiBadRequestResponse({ description: 'Bad Request' })
  async updateAnalyticsConfig(
    @ApiKey() apiKey: AuthCommonProto.ApiKey,
    @Param('projectId') projectId: string,
    @Body() request: UpdateAnalyticsConfigModel,
  ): Promise<AnalyticsConfigResponse> {
    const id = parseInt(projectId);
    if (Number.isNaN(id) || id < 0) {
      throw new BadRequestException('Project ID must be a valid integer');
    }

    const response = await lastValueFrom(
      this.analyticsConfigDbService.updateAnalyticsConfig({
        id: id,
        environment: apiKey.environment,
        analyticsKey: request.analyticsKey,
      }),
    );

    return new AnalyticsConfigResponse(response);
  }

  @Delete(':projectId')
  @ApiOperation({ summary: 'Delete analytics configuration' })
  @ApiOkResponse({
    description: 'Analytics configuration deleted successfully',
    type: AnalyticsConfigResponse,
  })
  @ApiNotFoundResponse({
    description: 'Analytics configuration not found',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiBadRequestResponse({ description: 'Bad Request' })
  async deleteAnalyticsConfig(
    @ApiKey() apiKey: AuthCommonProto.ApiKey,
    @Param('projectId') projectId: string,
  ): Promise<AnalyticsConfigResponse> {
    const id = parseInt(projectId);
    if (Number.isNaN(id) || id < 0) {
      throw new BadRequestException('Project ID must be a valid integer');
    }

    const response = await lastValueFrom(
      this.analyticsConfigDbService.deleteAnalyticsConfig({
        id: id,
        environment: apiKey.environment,
      }),
    );

    return new AnalyticsConfigResponse(response);
  }
}
