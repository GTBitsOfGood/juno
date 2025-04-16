import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { FileConfigProto, FileConfigProtoFile } from 'juno-proto';
import { join } from 'path';
import { FileConfigController } from './file_config.controller';
import { FileConfigService } from './file_config.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: join(__dirname, '../../../../../.env.local'),
    }),
    ClientsModule.register([
      {
        name: FileConfigProto.FILE_SERVICE_CONFIG_DB_SERVICE_NAME,
        transport: Transport.GRPC,
        options: {
          url: process.env.DB_SERVICE_ADDR,
          package: FileConfigProto.JUNO_FILE_SERVICE_CONFIG_PACKAGE_NAME,
          protoPath: FileConfigProtoFile,
        },
      },
    ]),
  ],
  controllers: [FileConfigController],
  providers: [FileConfigService],
})
export class FileConfigModule {}
