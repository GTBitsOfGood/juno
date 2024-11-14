import {
  Module,
  NestModule,
  RequestMethod,
  MiddlewareConsumer,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { join } from 'path';
import { FileDownloadController } from './file_download.controller';
import { ApiKeyMiddleware } from 'src/middleware/api_key.middleware';

import { ClientsModule, Transport } from '@nestjs/microservices';
import {
  ApiKeyProtoFile,
  FileProto,
  FileProtoFile,
} from 'juno-proto';
import { FILE_SERVICE_NAME } from 'juno-proto/dist/gen/file';
import {
  API_KEY_SERVICE_NAME,
  JUNO_API_KEY_PACKAGE_NAME,
} from 'juno-proto/dist/gen/api_key';

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
        name: FILE_SERVICE_NAME,
        transport: Transport.GRPC,
        options: {
          url: process.env.FILE_SERVICE_ADDR,
          package: FileProto.JUNO_FILE_SERVICE_FILE_PACKAGE_NAME,
          protoPath: FileProtoFile,
        },
      },
    ]),
  ],
  controllers: [FileDownloadController],
})
export class FileDownloadModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(ApiKeyMiddleware)
      .forRoutes({ path: '/file/download', method: RequestMethod.POST });
  }
}
