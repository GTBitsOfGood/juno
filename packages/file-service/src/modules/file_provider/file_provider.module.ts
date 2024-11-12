import { Module } from '@nestjs/common';
import { FileProviderController } from './file_provider.controller';
import { ConfigModule } from '@nestjs/config';
import { join } from 'path';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { FILE_PROVIDER_DB_SERVICE_NAME } from 'juno-proto/dist/gen/file_provider';
import { FileProviderProto, FileProviderProtoFile } from 'juno-proto';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: join(__dirname, '../../../../../.env.local'),
    }),
    ClientsModule.register([
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
export class FileProviderModule { }
