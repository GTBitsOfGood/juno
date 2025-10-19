import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { join } from 'path';
import { ApiKeyMiddleware } from 'src/middleware/api_key.middleware';
import { AnalyticsConfigController } from './analytics_config.controller';

import { ClientsModule, Transport } from '@nestjs/microservices';
import {
  AnalyticsConfigProto,
  AnalyticsConfigProtoFile,
  ApiKeyProtoFile,
  JwtProtoFile,
} from 'juno-proto';
import {
  API_KEY_SERVICE_NAME,
  JUNO_API_KEY_PACKAGE_NAME,
} from 'juno-proto/dist/gen/api_key';
import {
  JWT_SERVICE_NAME,
  JUNO_JWT_PACKAGE_NAME,
} from 'juno-proto/dist/gen/jwt';

const { ANALYTICS_CONFIG_DB_SERVICE_NAME, JUNO_ANALYTICS_SERVICE_ANALYTICS_CONFIG_PACKAGE_NAME } =
  AnalyticsConfigProto;

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: join(__dirname, '../../../../../.env.local'),
    }),
    ClientsModule.register([
      {
        name: API_KEY_SERVICE_NAME,
        transport: Transport.GRPC,
        options: {
          url: process.env.AUTH_SERVICE_ADDR,
          package: JUNO_API_KEY_PACKAGE_NAME,
          protoPath: ApiKeyProtoFile,
        },
      },
      {
        name: ANALYTICS_CONFIG_DB_SERVICE_NAME,
        transport: Transport.GRPC,
        options: {
          url: process.env.DB_SERVICE_ADDR,
          package: JUNO_ANALYTICS_SERVICE_ANALYTICS_CONFIG_PACKAGE_NAME,
          protoPath: AnalyticsConfigProtoFile,
        },
      },
      {
        name: JWT_SERVICE_NAME,
        transport: Transport.GRPC,
        options: {
          url: process.env.AUTH_SERVICE_ADDR,
          package: JUNO_JWT_PACKAGE_NAME,
          protoPath: JwtProtoFile,
        },
      },
    ]),
  ],
  controllers: [AnalyticsConfigController],
})
export class AnalyticsConfigModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(ApiKeyMiddleware).forRoutes('/analytics/config/*');
  }
}
