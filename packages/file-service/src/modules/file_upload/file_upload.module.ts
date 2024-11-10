import { Module } from '@nestjs/common';
import { FileUploadController } from './file_upload.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule } from '@nestjs/config';
import { join } from 'path';
import { FileProto, FileProtoFile } from 'juno-proto';

const { FILE_DB_SERVICE_NAME, JUNO_FILE_SERVICE_FILE_PACKAGE_NAME } = FileProto;

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
    ]),
  ],
  controllers: [FileUploadController],
})
export class FileUploadModule {}
