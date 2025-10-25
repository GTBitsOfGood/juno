import { IsString, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateAnalyticsConfigModel {
  @IsString()
  serverAnalyticsKey: string;

  @IsString()
  clientAnalyticsKey: string;
}

export class UpdateAnalyticsConfigModel {
  @IsOptional()
  @IsString()
  serverAnalyticsKey?: string;

  @IsOptional()
  @IsString()
  clientAnalyticsKey?: string;
}

export class AnalyticsConfigResponse {
  @Transform(({ value }) => Number(value))
  id: number;
  environment: string;
  serverAnalyticsKey: string;
  clientAnalyticsKey: string;

  constructor(config: any) {
    this.id = config.id;
    this.environment = config.environment;
    this.serverAnalyticsKey = config.serverAnalyticsKey;
    this.clientAnalyticsKey = config.clientAnalyticsKey;
  }
}
