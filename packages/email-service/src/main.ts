import { NestFactory, HttpAdapterHost } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { ConfigModule } from '@nestjs/config';
import { EmailProtoFile, EmailProto } from 'juno-proto';
import * as Sentry from '@sentry/node';
import { SentryFilter } from './sentry.filter';

async function bootstrap() {
  ConfigModule.forRoot({
    envFilePath: join(__dirname, '../../../.env.local'),
  });
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
  });
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.GRPC,
      options: {
        package: [EmailProto.JUNO_EMAIL_PACKAGE_NAME],
        protoPath: [EmailProtoFile],
        url: process.env.EMAIL_SERVICE_ADDR,
      },
    },
  );
  const { httpAdapter } = app.get(HttpAdapterHost);
  app.useGlobalFilters(new SentryFilter(httpAdapter));

  await app.listen();
}
bootstrap();
