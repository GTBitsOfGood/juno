import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { join } from 'path';
import { ApiKeyMiddleware } from 'src/middleware/api_key.middleware';
import { FileConfigController } from './file_config.controller';

import { ClientsModule, Transport } from '@nestjs/microservices';
import {
  ApiKeyProtoFile,
  FileConfigProto,
  FileConfigProtoFile,
  JwtProtoFile,
} from 'juno-proto';
import {
  API_KEY_SERVICE_NAME,
  JUNO_API_KEY_PACKAGE_NAME,
} from 'juno-proto/dist/gen/api_key';
import {
  FILE_SERVICE_CONFIG_DB_SERVICE_NAME,
  FILE_SERVICE_CONFIG_SERVICE_NAME,
} from 'juno-proto/dist/gen/file_config';
import {
  JWT_SERVICE_NAME,
  JUNO_JWT_PACKAGE_NAME,
} from 'juno-proto/dist/gen/jwt';

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
        name: FILE_SERVICE_CONFIG_DB_SERVICE_NAME,
        transport: Transport.GRPC,
        options: {
          url: process.env.DB_SERVICE_ADDR,
          package: FileConfigProto.JUNO_FILE_SERVICE_CONFIG_PACKAGE_NAME,
          protoPath: FileConfigProtoFile,
        },
      },
      {
        name: FILE_SERVICE_CONFIG_SERVICE_NAME,
        transport: Transport.GRPC,
        options: {
          url: process.env.FILE_SERVICE_ADDR,
          package: FileConfigProto.JUNO_FILE_SERVICE_CONFIG_PACKAGE_NAME,
          protoPath: FileConfigProtoFile,
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
  controllers: [FileConfigController],
})
export class FileConfigModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(ApiKeyMiddleware).forRoutes('/file/config/*');
  }
}
