import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { ConfigModule } from '@nestjs/config';
import { DBSERVICE_USER_PACKAGE_NAME } from 'juno-proto/src/gen/user';
import { DBSERVICE_PROJECT_PACKAGE_NAME } from 'juno-proto/src/gen/project';
import {
  UserProtoFile,
  ProjectProtoFile,
  IdentifiersProtoFile,
} from 'juno-proto';

async function bootstrap() {
  ConfigModule.forRoot({
    envFilePath: join(__dirname, '../../../.env.local'),
  });
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.GRPC,
      options: {
        package: [DBSERVICE_USER_PACKAGE_NAME, DBSERVICE_PROJECT_PACKAGE_NAME],
        protoPath: [UserProtoFile, ProjectProtoFile, IdentifiersProtoFile],
        url: process.env.DB_SERVICE_ADDR,
      },
    },
  );
  await app.listen();
}
bootstrap();
