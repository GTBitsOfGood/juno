import { Module } from '@nestjs/common';
import { JWTController } from './jwt.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ApiKeyProto, ApiKeyProtoFile } from 'juno-proto';

const { API_KEY_DB_SERVICE_NAME, JUNO_API_KEY_PACKAGE_NAME } = ApiKeyProto;
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
    ]),
  ],
  controllers: [JWTController],
})
export class JwtModule {}
