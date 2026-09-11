import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { FeatureFlagProto } from 'juno-proto';

export class CreateFeatureFlagModel {
  @ApiProperty({
    type: 'string',
    description: 'Unique identifier for the feature flag',
  })
  @IsString()
  id: string;

  @ApiPropertyOptional({
    type: 'boolean',
    description: 'Whether the flag is enabled. Defaults to false.',
  })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional({
    type: 'string',
    description: 'Human-readable description of the flag',
  })
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateFeatureFlagModel {
  @ApiPropertyOptional({
    type: 'boolean',
    description: 'Whether the flag is enabled',
  })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional({
    type: 'string',
    description: 'Human-readable description of the flag',
  })
  @IsOptional()
  @IsString()
  description?: string;
}

export class FeatureFlagResponse {
  @ApiProperty({ type: 'string', description: 'Feature flag ID' })
  id: string;

  @ApiProperty({ type: 'boolean', description: 'Whether the flag is enabled' })
  enabled: boolean;

  @ApiPropertyOptional({ type: 'string', description: 'Flag description' })
  description?: string;

  constructor(flag: FeatureFlagProto.FeatureFlag) {
    this.id = flag.id;
    this.enabled = flag.enabled;
    this.description = flag.description;
  }
}
