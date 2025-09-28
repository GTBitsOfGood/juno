import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AnalyticsProto, AnalyticsProtoFile } from 'juno-proto';
import { BogAnalyticsService } from 'src/bog-analytics.service';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { EventEnvironment } from 'bog-analytics';

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
  providers: [
    AnalyticsService,
    BogAnalyticsService,
    {
      provide: BogAnalyticsService,
      useFactory: () => {
        return new BogAnalyticsService({
          environment: EventEnvironment.DEVELOPMENT, // TODO: we'll have to switch this later
        });
      },
    },
  ],
})
export class AnalyticsModule {}
