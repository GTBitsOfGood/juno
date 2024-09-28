import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AuthController } from './auth.controller';
import { join } from 'path';
import { ConfigModule } from '@nestjs/config';
import {
  ApiKeyProto,
  ApiKeyProtoFile,
  JwtProto,
  JwtProtoFile,
} from 'juno-proto';

const { JWT_SERVICE_NAME, JUNO_JWT_PACKAGE_NAME } = JwtProto;
const { API_KEY_SERVICE_NAME, JUNO_API_KEY_PACKAGE_NAME } = ApiKeyProto;

console.log(JwtProtoFile);

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: join(__dirname, '../../../../../.env.local'),
    }),
    ClientsModule.register([
      {
        name: JWT_SERVICE_NAME,
        transport: Transport.GRPC,
        options: {
          url: process.env.AUTH_SERVICE_ADDR,
          package: JUNO_JWT_PACKAGE_NAME,
          protoPath: JwtProtoFile,
        },
      },
      {
        name: API_KEY_SERVICE_NAME,
        transport: Transport.GRPC,
        options: {
          url: process.env.AUTH_SERVICE_ADDR,
          package: JUNO_API_KEY_PACKAGE_NAME,
          protoPath: ApiKeyProtoFile,
        },
      },
    ]),
  ],
  controllers: [AuthController],
})
export class AuthModule {}
