import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { FeatureFlagProto } from 'juno-proto';

export class CreateFlagModel {
  @ApiProperty({
    type: 'string',
    description: 'The unique ID of the feature flag',
  })
  @IsNotEmpty()
  @IsString()
  id: string;

  @ApiProperty({
    type: 'boolean',
    description: 'Whether the feature flag is enabled',
  })
  @IsNotEmpty()
  @IsBoolean()
  enabled: boolean;

  @ApiPropertyOptional({
    type: 'string',
    description: 'A description of the feature flag',
  })
  @IsOptional()
  @IsString()
  description?: string;
}

export class SetFlagModel {
  @ApiPropertyOptional({
    type: 'boolean',
    description: 'Whether the feature flag is enabled',
  })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional({
    type: 'string',
    description: 'A description of the feature flag',
  })
  @IsOptional()
  @IsString()
  description?: string;
}

export class FeatureFlagResponse {
  @ApiProperty({
    type: 'string',
    description: 'The unique ID of the feature flag',
  })
  id: string;

  @ApiProperty({
    type: 'boolean',
    description: 'Whether the feature flag is enabled',
  })
  enabled: boolean;

  @ApiPropertyOptional({
    type: 'string',
    description: 'A description of the feature flag',
  })
  description?: string;

  constructor(flag: FeatureFlagProto.FeatureFlag) {
    this.id = flag.id;
    this.enabled = flag.enabled;
    this.description = flag.description ?? undefined;
  }
}

export class DeleteFlagResponse {
  @ApiProperty({
    type: 'boolean',
    description: 'Whether the feature flag was successfully deleted',
  })
  success: boolean;

  constructor(res: FeatureFlagProto.DeleteFlagResponse) {
    this.success = res.success;
  }
}
