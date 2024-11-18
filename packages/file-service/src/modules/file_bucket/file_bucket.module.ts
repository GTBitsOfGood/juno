import { Module } from '@nestjs/common';
import { FileBucketController } from './file_bucket.controller';
import { FileBucketService } from './file_bucket.service';
import { ConfigModule } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import {
  FileBucketProto,
  FileBucketProtoFile,
  FileProviderProto,
  FileProviderProtoFile,
} from 'juno-proto';
import { join } from 'path';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: join(__dirname, '../../../../../.env.local'),
    }),
    ClientsModule.register([
      {
        name: FileBucketProto.BUCKET_DB_SERVICE_NAME,
        transport: Transport.GRPC,
        options: {
          url: process.env.DB_SERVICE_ADDR,
          package: FileBucketProto.JUNO_FILE_SERVICE_BUCKET_PACKAGE_NAME,
          protoPath: FileBucketProtoFile,
        },
      },
      {
        name: FileProviderProto.FILE_PROVIDER_DB_SERVICE_NAME,
        transport: Transport.GRPC,
        options: {
          url: process.env.DB_SERVICE_ADDR,
          package: FileProviderProto.JUNO_FILE_SERVICE_PROVIDER_PACKAGE_NAME,
          protoPath: FileProviderProtoFile,
        },
      },
    ]),
  ],
  controllers: [FileBucketController],
  providers: [FileBucketService],
})
export class FileBucketModule {}
