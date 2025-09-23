import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import {
  FileProto,
  FileProtoFile,
  FileProviderProto,
  FileProviderProtoFile,
} from 'juno-proto';
import { join } from 'path';
import { FileTransferController } from './file_transfer.controller';

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
  controllers: [FileTransferController],
})
export class FileTransferModule {}
