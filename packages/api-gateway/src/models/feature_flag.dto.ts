import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateFeatureFlagModel {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsBoolean()
  enabled: boolean;

  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateFeatureFlagModel {
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsString()
  description?: string;
}

export class FeatureFlagResponse {
  id: string;
  enabled: boolean;
  description?: string;

  constructor(flag: {
    id: string;
    enabled: boolean;
    description?: string | null;
  }) {
    this.id = flag.id;
    this.enabled = flag.enabled;
    this.description = flag.description ?? undefined;
  }
}
