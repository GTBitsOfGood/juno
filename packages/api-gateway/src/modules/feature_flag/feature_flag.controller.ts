import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Patch,
  Delete,
  Inject,
  OnModuleInit,
} from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { FeatureFlagProto } from 'juno-proto';
import { lastValueFrom } from 'rxjs';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {
  CreateFlagModel,
  SetFlagModel,
  FeatureFlagResponse,
  DeleteFlagResponse,
} from 'src/models/feature_flag.dto';

const { FEATURE_FLAG_DB_SERVICE_NAME } = FeatureFlagProto;

@ApiBearerAuth('API_Key')
@ApiTags('feature-flag')
@Controller('feature-flag')
export class FeatureFlagController implements OnModuleInit {
  private featureFlagService: FeatureFlagProto.FeatureFlagDbServiceClient;

  constructor(
    @Inject(FEATURE_FLAG_DB_SERVICE_NAME) private client: ClientGrpc,
  ) {}

  onModuleInit() {
    this.featureFlagService =
      this.client.getService<FeatureFlagProto.FeatureFlagDbServiceClient>(
        FEATURE_FLAG_DB_SERVICE_NAME,
      );
  }

  @Post('create')
  @ApiOperation({ summary: 'Creates a Feature Flag.' })
  @ApiBadRequestResponse({ description: 'Parameters are invalid' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiCreatedResponse({
    description:
      'Returned the created feature flag associated with the given data',
    type: FeatureFlagResponse,
  })
  async createFlag(
    @Body() body: CreateFlagModel,
  ): Promise<FeatureFlagResponse> {
    const response = this.featureFlagService.createFlag({
      id: body.id,
      enabled: body.enabled,
      description: body.description,
    });

    const flagData = await lastValueFrom(response);
    return new FeatureFlagResponse(flagData);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Gets a Feature Flag by ID.' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiOkResponse({
    description: 'Returned the requested feature flag',
    type: FeatureFlagResponse,
  })
  async getFlag(@Param('id') id: string): Promise<FeatureFlagResponse> {
    const response = this.featureFlagService.getFlag({ id });
    const flagData = await lastValueFrom(response);
    return new FeatureFlagResponse(flagData);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Updates an existing Feature Flag.' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiOkResponse({
    description: 'Returned the updated feature flag',
    type: FeatureFlagResponse,
  })
  async setFlag(
    @Param('id') id: string,
    @Body() body: SetFlagModel,
  ): Promise<FeatureFlagResponse> {
    const response = this.featureFlagService.setFlag({
      id,
      enabled: body.enabled,
      description: body.description,
    });

    const flagData = await lastValueFrom(response);
    return new FeatureFlagResponse(flagData);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deletes a Feature Flag.' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiOkResponse({
    description: 'Returned the delete confirmation',
    type: DeleteFlagResponse,
  })
  async deleteFlag(@Param('id') id: string): Promise<DeleteFlagResponse> {
    const response = this.featureFlagService.deleteFlag({ id });
    const flagData = await lastValueFrom(response);
    return new DeleteFlagResponse(flagData);
  }
}
