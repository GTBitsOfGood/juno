import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AnalyticsProto, AnalyticsProtoFile } from 'juno-proto';
import { BogAnalyticsService } from 'src/analytics.service';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';

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
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService, BogAnalyticsService],
})
export class AnalyticsModule {}
