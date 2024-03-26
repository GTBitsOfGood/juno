import { NestFactory, Reflector, HttpAdapterHost } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigModule } from '@nestjs/config';
import { join } from 'path';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { RpcExceptionFilter } from './rpc_exception_filter';
import * as Sentry from '@sentry/node';
import { SentryFilter } from './sentry.filter';

async function bootstrap() {
  ConfigModule.forRoot({
    envFilePath: join(__dirname, '../../../.env.local'),
  });
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
  });
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
    }),
  );
  const { httpAdapter } = app.get(HttpAdapterHost);
  app.useGlobalFilters(new SentryFilter(httpAdapter));

  app.useGlobalFilters(new RpcExceptionFilter());
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
  await app.listen(3000);
}
bootstrap();
