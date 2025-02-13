import { Module } from '@nestjs/common';
import { JWTController } from './jwt.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import {
  ApiKeyProto,
  ApiKeyProtoFile,
  UserProto,
  UserProtoFile,
} from 'juno-proto';

const { API_KEY_DB_SERVICE_NAME, JUNO_API_KEY_PACKAGE_NAME } = ApiKeyProto;

const { USER_SERVICE_NAME, JUNO_USER_PACKAGE_NAME } = UserProto;

@Module({
  imports: [
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
  controllers: [JWTController],
})
export class JwtModule {}
