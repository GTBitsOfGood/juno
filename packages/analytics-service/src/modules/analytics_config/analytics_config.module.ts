import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AnalyticsConfigProto, AnalyticsConfigProtoFile } from 'juno-proto';
import { AnalyticsConfigService } from './analytics_config.service';

const {
  ANALYTICS_CONFIG_DB_SERVICE_NAME,
  JUNO_ANALYTICS_SERVICE_ANALYTICS_CONFIG_PACKAGE_NAME,
} = AnalyticsConfigProto;

@Module({
  imports: [
    ClientsModule.register([
      {
        name: ANALYTICS_CONFIG_DB_SERVICE_NAME,
        transport: Transport.GRPC,
        options: {
          url: process.env.DB_SERVICE_ADDR,
          package: JUNO_ANALYTICS_SERVICE_ANALYTICS_CONFIG_PACKAGE_NAME,
          protoPath: AnalyticsConfigProtoFile,
        },
      },
    ]),
  ],
  providers: [AnalyticsConfigService],
  exports: [AnalyticsConfigService],
})
export class AnalyticsConfigModule {}
