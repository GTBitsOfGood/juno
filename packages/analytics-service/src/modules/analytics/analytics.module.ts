import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AnalyticsConfigProto, AnalyticsConfigProtoFile, AnalyticsProto, AnalyticsProtoFile } from 'juno-proto';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { AnalyticsConfigModule } from '../analytics_config/analytics_config.module';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: AnalyticsConfigProto.ANALYTICS_CONFIG_DB_SERVICE_NAME,
        transport: Transport.GRPC,
        options: {
          url: process.env.DB_SERVICE_ADDR,
          package: AnalyticsConfigProto.JUNO_ANALYTICS_SERVICE_ANALYTICS_CONFIG_PACKAGE_NAME,
          protoPath: AnalyticsConfigProtoFile,
        },
      },
    ]),
    AnalyticsConfigModule,
  ],
  controllers: [AnalyticsController],
  providers: [
    AnalyticsService,
  ],
})
export class AnalyticsModule {}
