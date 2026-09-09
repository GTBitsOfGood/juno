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
  Put,
} from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { FeatureFlagProto } from 'juno-proto';
import { lastValueFrom } from 'rxjs';
import {
  CreateFeatureFlagModel,
  FeatureFlagResponse,
  UpdateFeatureFlagModel,
} from 'src/models/feature_flag.dto';

const { FEATURE_FLAG_SERVICE_NAME } = FeatureFlagProto;

@Controller('feature_flag')
@ApiBearerAuth('API_Key')
@ApiTags('feature_flag')
export class FeatureFlagController implements OnModuleInit {
  private featureFlagService: FeatureFlagProto.FeatureFlagServiceClient;

  constructor(
    @Inject(FEATURE_FLAG_SERVICE_NAME)
    private featureFlagClient: ClientGrpc,
  ) {}

  onModuleInit() {
    this.featureFlagService =
      this.featureFlagClient.getService<FeatureFlagProto.FeatureFlagServiceClient>(
        FEATURE_FLAG_SERVICE_NAME,
      );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a feature flag. ' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: FeatureFlagResponse,
  })
  async getFlag(@Param('id') id: string): Promise<FeatureFlagResponse> {
    const flag = await lastValueFrom(this.featureFlagService.getFlag({ id }));
    return new FeatureFlagResponse(flag);
  }

  @Post()
  @ApiOperation({ summary: 'Create a feature flag' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    type: FeatureFlagResponse,
  })
  async createFlag(
    @Body() request: CreateFeatureFlagModel,
  ): Promise<FeatureFlagResponse> {
    const flag = await lastValueFrom(
      this.featureFlagService.createFlag(request),
    );
    return new FeatureFlagResponse(flag);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a feature flag' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: FeatureFlagResponse,
  })
  async setFlag(
    @Param('id') id: string,
    @Body() request: UpdateFeatureFlagModel,
  ): Promise<FeatureFlagResponse> {
    const flag = await lastValueFrom(
      this.featureFlagService.setFlag({
        id,
        enabled: request.enabled,
        description: request.description,
      }),
    );
    return new FeatureFlagResponse(flag);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a feature flag' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: FeatureFlagResponse,
  })
  async deleteFlag(@Param('id') id: string) {
    const flag = await lastValueFrom(
      this.featureFlagService.deleteFlag({ id }),
    );
    return new FeatureFlagResponse(flag);
  }
}
