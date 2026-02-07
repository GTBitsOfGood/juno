import './instrument';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { ConfigModule } from '@nestjs/config';
import {
  UserProtoFile,
  ProjectProtoFile,
  IdentifiersProtoFile,
  UserProto,
  ProjectProto,
  HealthProto,
  HealthProtoFile,
  ResetProto,
  ResetProtoFile,
  ApiKeyProto,
  ApiKeyProtoFile,
  EmailProto,
  EmailProtoFile,
  FileProto,
  FileProtoFile,
  FileBucketProto,
  FileBucketProtoFile,
  FileConfigProto,
  FileConfigProtoFile,
  FileProviderProto,
  FileProviderProtoFile,
  AnalyticsConfigProto,
  AnalyticsConfigProtoFile,
  CounterProto,
  CounterProtoFile,
} from 'juno-proto';
import { CustomRpcExceptionFilter } from './global-exception.filter';

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
          UserProto.JUNO_USER_PACKAGE_NAME,
          ProjectProto.JUNO_PROJECT_PACKAGE_NAME,
          HealthProto.GRPC_HEALTH_V1_PACKAGE_NAME,
          ResetProto.JUNO_RESET_DB_PACKAGE_NAME,
          ApiKeyProto.JUNO_API_KEY_PACKAGE_NAME,
          EmailProto.JUNO_EMAIL_PACKAGE_NAME,
          FileProto.JUNO_FILE_SERVICE_FILE_PACKAGE_NAME,
          FileBucketProto.JUNO_FILE_SERVICE_BUCKET_PACKAGE_NAME,
          FileConfigProto.JUNO_FILE_SERVICE_CONFIG_PACKAGE_NAME,
          FileProviderProto.JUNO_FILE_SERVICE_PROVIDER_PACKAGE_NAME,
          AnalyticsConfigProto.JUNO_ANALYTICS_SERVICE_ANALYTICS_CONFIG_PACKAGE_NAME,
          CounterProto.JUNO_COUNTER_PACKAGE_NAME,
        ],
        protoPath: [
          UserProtoFile,
          ProjectProtoFile,
          IdentifiersProtoFile,
          HealthProtoFile,
          ResetProtoFile,
          ApiKeyProtoFile,
          EmailProtoFile,
          FileProtoFile,
          FileBucketProtoFile,
          FileConfigProtoFile,
          FileProviderProtoFile,
          AnalyticsConfigProtoFile,
          CounterProtoFile,
        ],
        url: process.env.DB_SERVICE_ADDR,
      },
    },
  );

  app.useGlobalFilters(new CustomRpcExceptionFilter());
  await app.listen();
}
bootstrap();
