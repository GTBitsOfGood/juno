import {
  Module,
  NestModule,
  RequestMethod,
  MiddlewareConsumer,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { join } from 'path';
import { FileBucketController } from './file_bucket.controller';
import { ApiKeyMiddleware } from 'src/middleware/api_key.middleware';

import { ClientsModule, Transport } from '@nestjs/microservices';
import {
  ApiKeyProtoFile,
  FileBucketProto,
  FileBucketProtoFile,
  JwtProtoFile,
} from 'juno-proto';
import {
  API_KEY_SERVICE_NAME,
  JUNO_API_KEY_PACKAGE_NAME,
} from 'juno-proto/dist/gen/api_key';
import { BUCKET_FILE_SERVICE_NAME } from 'juno-proto/dist/gen/file_bucket';
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
        name: JWT_SERVICE_NAME,
        transport: Transport.GRPC,
        options: {
          url: process.env.AUTH_SERVICE_ADDR,
          package: JUNO_JWT_PACKAGE_NAME,
          protoPath: JwtProtoFile,
        },
      },
      {
        name: BUCKET_FILE_SERVICE_NAME,
        transport: Transport.GRPC,
        options: {
          url: process.env.FILE_SERVICE_ADDR,
          package: FileBucketProto.JUNO_FILE_SERVICE_BUCKET_PACKAGE_NAME,
          protoPath: FileBucketProtoFile,
        },
      },
    ]),
  ],
  controllers: [FileBucketController],
})
export class FileBucketModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(ApiKeyMiddleware)
      .forRoutes({ path: '/file/bucket', method: RequestMethod.POST });
  }
}
