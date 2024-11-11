import {
  Module,
  NestModule,
  RequestMethod,
  MiddlewareConsumer,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { join } from 'path';
import { FileProviderController } from './file_provider.controller';
import { ApiKeyMiddleware } from 'src/middleware/api_key.middleware';
import {
  API_KEY_SERVICE_NAME,
  JUNO_API_KEY_PACKAGE_NAME,
} from 'juno-proto/dist/gen/api_key';
import { ClientsModule, Transport } from '@nestjs/microservices';
import {
  ApiKeyProtoFile,
  FileProviderProto,
  FileProviderProtoFile,
} from 'juno-proto';
import { FILE_PROVIDER_FILE_SERVICE_NAME } from 'juno-proto/dist/gen/file_provider';

// TODO: Make this module Auth protected
@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: join(__dirname, '../../../../../.env.local'),
    }),
    ClientsModule.register([
      {
        name: FILE_PROVIDER_FILE_SERVICE_NAME,
        transport: Transport.GRPC,
        options: {
          url: process.env.FILE_SERVICE_ADDR,
          package: FileProviderProto.FILE_PROVIDER_FILE_SERVICE_NAME,
          protoPath: FileProviderProtoFile,
        },
      },
    ]),
  ],
  controllers: [FileProviderController],
})
export class FileProviderAPIModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(ApiKeyMiddleware)
      .forRoutes({ path: 'file-provider', method: RequestMethod.POST });
  }
}
