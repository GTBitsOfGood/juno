import './instrument';
import { NestFactory, HttpAdapterHost } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { ConfigModule } from '@nestjs/config';
import {
  FileProviderProto,
  FileConfigProto,
  FileBucketProto,
  FileProto,
  FileProviderProtoFile,
  FileConfigProtoFile,
  FileBucketProtoFile,
  FileProtoFile,
  HealthProto,
  HealthProtoFile,
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
          FileProviderProto.JUNO_FILE_SERVICE_PROVIDER_PACKAGE_NAME,
          FileConfigProto.JUNO_FILE_SERVICE_CONFIG_PACKAGE_NAME,
          FileBucketProto.JUNO_FILE_SERVICE_BUCKET_PACKAGE_NAME,
          FileProto.JUNO_FILE_SERVICE_FILE_PACKAGE_NAME,
          HealthProto.GRPC_HEALTH_V1_PACKAGE_NAME,
        ],
        protoPath: [
          FileProviderProtoFile,
          FileConfigProtoFile,
          FileBucketProtoFile,
          FileProtoFile,
          HealthProtoFile,
        ],
        url: process.env.FILE_SERVICE_ADDR,
      },
    },
  );
  const { httpAdapter } = app.get(HttpAdapterHost);
  app.useGlobalFilters(new SentryFilter(httpAdapter));

  await app.listen();
}
bootstrap();
