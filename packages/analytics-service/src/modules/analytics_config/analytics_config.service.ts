import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { AnalyticsConfigProto } from 'juno-proto';
import { lastValueFrom } from 'rxjs';

const { ANALYTICS_CONFIG_DB_SERVICE_NAME } = AnalyticsConfigProto;

@Injectable()
export class AnalyticsConfigService implements OnModuleInit {
  private analyticsConfigDbService: AnalyticsConfigProto.AnalyticsConfigDbServiceClient;

  constructor(
    @Inject(ANALYTICS_CONFIG_DB_SERVICE_NAME)
    private analyticsConfigDbClient: ClientGrpc,
  ) {}

  onModuleInit() {
    this.analyticsConfigDbService =
      this.analyticsConfigDbClient.getService<AnalyticsConfigProto.AnalyticsConfigDbServiceClient>(
        ANALYTICS_CONFIG_DB_SERVICE_NAME,
      );
  }

  async getAnalyticsKey(
    projectId: number,
    environment: string,
  ): Promise<string> {
    const config = await lastValueFrom(
      this.analyticsConfigDbService.readAnalyticsConfig({
        id: projectId,
        environment,
      }),
    );
    return config.analyticsKey;
  }
}
