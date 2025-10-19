import { IsString, IsOptional } from 'class-validator';

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
  id: string;
  environment: string;
  analyticsKey: string;

  constructor(config: any) {
    this.id = config.id;
    this.environment = config.environment;
    this.analyticsKey = config.analyticsKey;
  }
}
