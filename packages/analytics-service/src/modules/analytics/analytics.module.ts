import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AnalyticsProto, AnalyticsProtoFile } from 'juno-proto';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { AnalyticsConfigModule } from '../analytics_config/analytics_config.module';

const {
  ANALYTICS_SERVICE_NAME,
  JUNO_ANALYTICS_SERVICE_ANALYTICS_PACKAGE_NAME,
} = AnalyticsProto;

@Module({
  imports: [
    ClientsModule.register([
      {
        name: ANALYTICS_SERVICE_NAME,
        transport: Transport.GRPC,
        options: {
          package: JUNO_ANALYTICS_SERVICE_ANALYTICS_PACKAGE_NAME,
          protoPath: AnalyticsProtoFile,
        },
      },
    ]),
    AnalyticsConfigModule,
  ],
  controllers: [AnalyticsController],
  providers: [
    AnalyticsService,
    {
      provide: 'BOG_ANALYTICS',
      useFactory: async () => {
        // bog-analytics is absolutely cursed and outdated, have to do some shenanigans
        // to get around ESM import
        const loadModule = eval('(specifier) => import(specifier)');
        const { AnalyticsLogger, EventEnvironment } =
          await loadModule('bog-analytics');

        return new AnalyticsLogger({
          environment: EventEnvironment.DEVELOPMENT,
        });
      },
    },
    {
      provide: AnalyticsViewerService,
      useFactory: () => {
        return new AnalyticsViewerService({
          environment: EventEnvironment.DEVELOPMENT, // TODO: we'll have to switch this later
        });
      },
    },
  ],
})
export class AnalyticsModule {}
