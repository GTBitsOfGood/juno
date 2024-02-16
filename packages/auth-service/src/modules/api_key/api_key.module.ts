import { Module } from '@nestjs/common';
import { ApiKeyController } from './api_key.controller';
import { ConfigModule } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import {
  ApiKeyProto,
  ApiKeyProtoFile,
  UserProto,
  UserProtoFile,
} from 'juno-proto';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: ApiKeyProto.API_KEY_SERVICE_NAME,
        transport: Transport.GRPC,
        options: {
          url: process.env.DB_SERVICE_ADDR,
          package: ApiKeyProto.JUNO_API_KEY_PACKAGE_NAME,
          protoPath: ApiKeyProtoFile,
        },
      },
    ]),
    ClientsModule.register([
      {
        name: UserProto.USER_SERVICE_NAME,
        transport: Transport.GRPC,
        options: {
          url: process.env.DB_SERVICE_ADDR,
          package: UserProto.JUNO_USER_PACKAGE_NAME,
          protoPath: UserProtoFile,
        },
      },
    ]),
  ],
  controllers: [ApiKeyController],
})
export class ApiKeyModule {}
