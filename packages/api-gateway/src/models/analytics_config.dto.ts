import { IsString, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateAnalyticsConfigModel {
  @IsString()
  analyticsKey: string;
}

export class UpdateAnalyticsConfigModel {
  @IsOptional()
  @IsString()
  analyticsKey?: string;
}

export class AnalyticsConfigResponse {
  @Transform(({ value }) => Number(value))
  id: number;
  environment: string;
  analyticsKey: string;

  constructor(config: any) {
    this.id = config.id;
    this.environment = config.environment;
    this.analyticsKey = config.analyticsKey;
  }
}
