import { NestFactory, HttpAdapterHost } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { ConfigModule } from '@nestjs/config';
import { LoggingProtoFile } from 'juno-proto';
import { JUNO_LOGGING_PACKAGE_NAME } from 'juno-proto/dist/gen/logging';
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
        package: JUNO_LOGGING_PACKAGE_NAME,
        protoPath: [LoggingProtoFile],
        url: process.env.LOGGING_SERVICE_ADDR,
      },
    },
  );
  const { httpAdapter } = app.get(HttpAdapterHost);
  app.useGlobalFilters(new SentryFilter(httpAdapter));

  await app.listen();
}
bootstrap();
