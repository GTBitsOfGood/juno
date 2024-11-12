import { Module } from '@nestjs/common';
import { FileController } from './file.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule } from '@nestjs/config';
import { join } from 'path';
import {
  FileProto, FileProtoFile,
  FileProviderProto, FileProviderProtoFile,
} from 'juno-proto';

const { FILE_DB_SERVICE_NAME, JUNO_FILE_SERVICE_FILE_PACKAGE_NAME } = FileProto;
const { FILE_PROVIDER_DB_SERVICE_NAME } = FileProviderProto;

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: join(__dirname, '../../../../../.env.local'),
    }),
    ClientsModule.register([
      {
        name: FILE_DB_SERVICE_NAME,
        transport: Transport.GRPC,
        options: {
          url: process.env.DB_SERVICE_ADDR,
          package: JUNO_FILE_SERVICE_FILE_PACKAGE_NAME,
          protoPath: FileProtoFile,
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
  controllers: [FileController],
})
export class FileModule { }
