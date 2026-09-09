import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Delete,
  Inject,
  OnModuleInit,
  BadRequestException,
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

const { FEATURE_FLAG_SERVICE_NAME } = FeatureFlagProto;

@ApiBearerAuth('API_Key')
@ApiTags('feature-flags')
@Controller('feature-flags')
export class FeatureFlagController implements OnModuleInit {
  private featureFlagService: FeatureFlagProto.FeatureFlagServiceController;

  constructor(
    @Inject(FEATURE_FLAG_SERVICE_NAME) private client: ClientGrpc,
  ) {}

  onModuleInit() {
    this.featureFlagService =
      this.client.getService<FeatureFlagProto.FeatureFlagServiceController>(
        FEATURE_FLAG_SERVICE_NAME,
      );
  }

  @Post()
  @ApiOperation({ summary: 'Creates a Feature Flag.' })
  @ApiBadRequestResponse({ description: 'Parameters are invalid' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiCreatedResponse({
    description: 'Returned the created feature flag associated with the given data',
  })
  async createFlag(
    @Body('id') id: string,
    @Body('enabled') enabled: boolean,
    @Body('description') description?: string,
  ) {
    if (!id || id.trim() === '') {
      throw new BadRequestException('id must exist and be non-empty');
    }
    if (enabled === undefined) {
      throw new BadRequestException('enabled must be included');
    }

    const response = this.featureFlagService.createFlag({
      id,
      enabled,
      description,
    });

    const flagData = await lastValueFrom(response);
    return flagData;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Gets a Feature Flag by ID.' })
  @ApiBadRequestResponse({ description: 'Parameters are invalid' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiOkResponse({
    description: 'Returned the requested feature flag',
  })
  async getFlag(@Param('id') id: string) {
    if (!id || id.trim() === '') {
      throw new BadRequestException('id must exist and be non-empty');
    }

    const response = this.featureFlagService.getFlag({ id });
    const flagData = await lastValueFrom(response);
    return flagData;
  }

  @Put(':id')
  @ApiOperation({ summary: 'Updates an existing Feature Flag.' })
  @ApiBadRequestResponse({ description: 'Parameters are invalid' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiOkResponse({
    description: 'Returned the updated feature flag',
  })
  async setFlag(
    @Param('id') id: string,
    @Body('enabled') enabled: boolean,
    @Body('description') description?: string,
  ) {
    if (!id || id.trim() === '') {
      throw new BadRequestException('id must exist and be non-empty');
    }
    if (enabled === undefined) {
      throw new BadRequestException('enabled must be included');
    }

    const response = this.featureFlagService.setFlag({
      id,
      enabled,
      description,
    });

    const flagData = await lastValueFrom(response);
    return flagData;
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deletes a Feature Flag.' })
  @ApiBadRequestResponse({ description: 'Parameters are invalid' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiOkResponse({
    description: 'Returned the delete confirmation',
  })
  async deleteFlag(@Param('id') id: string) {
    if (!id || id.trim() === '') {
      throw new BadRequestException('id must exist and be non-empty');
    }

    const response = this.featureFlagService.deleteFlag({ id });
    const flagData = await lastValueFrom(response);
    return flagData;
  }
}
