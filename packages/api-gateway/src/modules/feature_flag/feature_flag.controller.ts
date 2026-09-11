import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Inject,
  OnModuleInit,
  Param,
  Body,
} from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import {
  ApiBearerAuth,
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { FeatureFlagProto } from 'juno-proto';
import { lastValueFrom } from 'rxjs';
import {
  CreateFeatureFlagModel,
  UpdateFeatureFlagModel,
  FeatureFlagResponse,
} from 'src/models/feature_flag.dto';

const { FEATURE_FLAG_SERVICE_NAME } = FeatureFlagProto;

@ApiBearerAuth('API_Key')
@ApiTags('feature-flag')
@Controller('feature-flags')
export class FeatureFlagController implements OnModuleInit {
  private featureFlagService: FeatureFlagProto.FeatureFlagServiceClient;

  constructor(
    @Inject(FEATURE_FLAG_SERVICE_NAME) private featureFlagClient: ClientGrpc,
  ) {}

  onModuleInit() {
    this.featureFlagService =
      this.featureFlagClient.getService<FeatureFlagProto.FeatureFlagServiceClient>(
        FEATURE_FLAG_SERVICE_NAME,
      );
  }

  @Post()
  @ApiOperation({ summary: 'Create a feature flag' })
  @ApiCreatedResponse({
    description: 'Feature flag created successfully',
    type: FeatureFlagResponse,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiBadRequestResponse({ description: 'Bad Request' })
  async createFlag(
    @Body() request: CreateFeatureFlagModel,
  ): Promise<FeatureFlagResponse> {
    const response = await lastValueFrom(
      this.featureFlagService.createFlag({
        id: request.id,
        enabled: request.enabled,
        description: request.description,
      }),
    );
    return new FeatureFlagResponse(response.flag);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a feature flag by ID' })
  @ApiOkResponse({
    description: 'Feature flag retrieved successfully',
    type: FeatureFlagResponse,
  })
  @ApiNotFoundResponse({ description: 'Feature flag not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async getFlag(@Param('id') id: string): Promise<FeatureFlagResponse> {
    const response = await lastValueFrom(
      this.featureFlagService.getFlag({ id }),
    );
    return new FeatureFlagResponse(response.flag);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a feature flag' })
  @ApiOkResponse({
    description: 'Feature flag updated successfully',
    type: FeatureFlagResponse,
  })
  @ApiNotFoundResponse({ description: 'Feature flag not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiBadRequestResponse({ description: 'Bad Request' })
  async setFlag(
    @Param('id') id: string,
    @Body() request: UpdateFeatureFlagModel,
  ): Promise<FeatureFlagResponse> {
    const response = await lastValueFrom(
      this.featureFlagService.setFlag({
        id,
        enabled: request.enabled,
        description: request.description,
      }),
    );
    return new FeatureFlagResponse(response.flag);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a feature flag' })
  @ApiOkResponse({ description: 'Feature flag deleted successfully' })
  @ApiNotFoundResponse({ description: 'Feature flag not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async deleteFlag(@Param('id') id: string): Promise<{ success: boolean }> {
    const response = await lastValueFrom(
      this.featureFlagService.deleteFlag({ id }),
    );
    return { success: response.success };
  }
}
