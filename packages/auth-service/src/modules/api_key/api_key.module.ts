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
import { join } from 'path';

const { USER_SERVICE_NAME, JUNO_USER_PACKAGE_NAME } = UserProto;
const { API_KEY_DB_SERVICE_NAME, JUNO_API_KEY_PACKAGE_NAME } = ApiKeyProto;

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: join(__dirname, '../../../../../.env.local'),
    }),
    ClientsModule.register([
      {
        name: API_KEY_DB_SERVICE_NAME,
        transport: Transport.GRPC,
        options: {
          url: process.env.DB_SERVICE_ADDR,
          package: JUNO_API_KEY_PACKAGE_NAME,
          protoPath: ApiKeyProtoFile,
        },
      },
      {
        name: USER_SERVICE_NAME,
        transport: Transport.GRPC,
        options: {
          url: process.env.DB_SERVICE_ADDR,
          package: JUNO_USER_PACKAGE_NAME,
          protoPath: UserProtoFile,
        },
      },
    ]),
  ],
  controllers: [ApiKeyController],
})
export class ApiKeyModule {}
