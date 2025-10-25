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

  // TODO: This method isn't used by anything; should either be used in replacement of other code
  // or removed entirely
  async getAnalyticsKeys(
    projectId: number,
    environment: string,
  ): Promise<[string, string]> {
    const config = await lastValueFrom(
      this.analyticsConfigDbService.readAnalyticsConfig({
        id: projectId,
        environment,
      }),
    );
    return [config.serverAnalyticsKey, config.clientAnalyticsKey];
  }
}
