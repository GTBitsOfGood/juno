import './instrument';
import { NestFactory, HttpAdapterHost } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { ConfigModule } from '@nestjs/config';
import {
  ApiKeyProto,
  JwtProto,
  ApiKeyProtoFile,
  JwtProtoFile,
  HealthProto,
  HealthProtoFile,
  UserProto,
  UserProtoFile,
} from 'juno-proto';
import { SentryFilter } from './sentry.filter';

async function bootstrap() {
  ConfigModule.forRoot({
    envFilePath: join(__dirname, '../../../.env.local'),
  });
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.GRPC,
      options: {
        package: [
          ApiKeyProto.JUNO_API_KEY_PACKAGE_NAME,
          JwtProto.JUNO_JWT_PACKAGE_NAME,
          HealthProto.GRPC_HEALTH_V1_PACKAGE_NAME,
          UserProto.JUNO_USER_PACKAGE_NAME,
        ],
        protoPath: [
          ApiKeyProtoFile,
          JwtProtoFile,
          HealthProtoFile,
          UserProtoFile,
        ],
        url: process.env.AUTH_SERVICE_ADDR,
      },
    },
  );
  const { httpAdapter } = app.get(HttpAdapterHost);
  app.useGlobalFilters(new SentryFilter(httpAdapter));

  await app.listen();
}
bootstrap();
