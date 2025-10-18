import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { AnalyticsController } from './analytics.controller';
import {
  AnalyticsProto,
  AnalyticsProtoFile,
  ApiKeyProto,
  ApiKeyProtoFile,
  JwtProto,
  JwtProtoFile,
} from 'juno-proto';
import { ApiKeyMiddleware } from 'src/middleware/api_key.middleware';

const { JWT_SERVICE_NAME, JUNO_JWT_PACKAGE_NAME } = JwtProto;
const {
  ANALYTICS_SERVICE_NAME,
  JUNO_ANALYTICS_SERVICE_ANALYTICS_PACKAGE_NAME,
} = AnalyticsProto;
const { API_KEY_SERVICE_NAME, JUNO_API_KEY_PACKAGE_NAME } = ApiKeyProto;

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: join(__dirname, '../../../../../.env.local'),
    }),
    ClientsModule.register([
      {
        name: JWT_SERVICE_NAME,
        transport: Transport.GRPC,
        options: {
          url: process.env.AUTH_SERVICE_ADDR,
          package: JUNO_JWT_PACKAGE_NAME,
          protoPath: JwtProtoFile,
        },
      },
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
        name: ANALYTICS_SERVICE_NAME,
        transport: Transport.GRPC,
        options: {
          url: process.env.ANALYTICS_SERVICE_ADDR,
          package: JUNO_ANALYTICS_SERVICE_ANALYTICS_PACKAGE_NAME,
          protoPath: AnalyticsProtoFile,
        },
      },
    ]),
  ],
  controllers: [AnalyticsController],
})
export class AnalyticsModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(ApiKeyMiddleware).forRoutes('analytics/*');
  }
}
