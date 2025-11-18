import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { join } from 'path';
import { ApiKeyMiddleware } from 'src/middleware/api_key.middleware';
import { FileProviderController } from './file_provider.controller';

import { ClientsModule, Transport } from '@nestjs/microservices';
import {
  ApiKeyProtoFile,
  FileProviderProto,
  FileProviderProtoFile,
  JwtProtoFile,
} from 'juno-proto';
import {
  API_KEY_SERVICE_NAME,
  JUNO_API_KEY_PACKAGE_NAME,
} from 'juno-proto/dist/gen/api_key';
import {
  FILE_PROVIDER_DB_SERVICE_NAME,
  FILE_PROVIDER_FILE_SERVICE_NAME,
} from 'juno-proto/dist/gen/file_provider';
import {
  JUNO_JWT_PACKAGE_NAME,
  JWT_SERVICE_NAME,
} from 'juno-proto/dist/gen/jwt';

// TODO: Make this module Auth protected
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
        name: JWT_SERVICE_NAME,
        transport: Transport.GRPC,
        options: {
          url: process.env.AUTH_SERVICE_ADDR,
          package: JUNO_JWT_PACKAGE_NAME,
          protoPath: JwtProtoFile,
        },
      },
      {
        name: FILE_PROVIDER_FILE_SERVICE_NAME,
        transport: Transport.GRPC,
        options: {
          url: process.env.FILE_SERVICE_ADDR,
          package: FileProviderProto.JUNO_FILE_SERVICE_PROVIDER_PACKAGE_NAME,
          protoPath: FileProviderProtoFile,
        },
      },
      {
        name: FILE_PROVIDER_DB_SERVICE_NAME,
        transport: Transport.GRPC,
        options: {
          url: process.env.DB_SERVICE_ADDR,
          package: FileProviderProto.JUNO_FILE_SERVICE_PROVIDER_PACKAGE_NAME,
          protoPath: FileProviderProtoFile,
        },
      },
    ]),
  ],
  controllers: [FileProviderController],
})
export class FileProviderModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(ApiKeyMiddleware)
      .forRoutes('/file/provider', '/file/provider/*');
  }
}
