import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AuthController } from './auth.controller';
import {
  AUTHSERVICE_JWT_PACKAGE_NAME,
  JWT_SERVICE_NAME,
} from 'src/auth-service/gen/jwt';
import { join } from 'path';
import {
  API_KEY_SERVICE_NAME,
  AUTHSERVICE_API_KEY_PACKAGE_NAME,
} from 'src/auth-service/gen/api_key';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: JWT_SERVICE_NAME,
        transport: Transport.GRPC,
        options: {
          url: '0.0.0.0:50052',
          package: AUTHSERVICE_JWT_PACKAGE_NAME,
          protoPath: join(
            __dirname,
            '../../../../proto/auth-service/jwt.proto',
          ),
        },
      },
      {
        name: API_KEY_SERVICE_NAME,
        transport: Transport.GRPC,
        options: {
          url: '0.0.0.0:50052',
          package: AUTHSERVICE_API_KEY_PACKAGE_NAME,
          protoPath: join(
            __dirname,
            '../../../../proto/auth-service/api_key.proto',
          ),
        },
      },
    ]),
  ],
  controllers: [AuthController],
})
export class AuthModule {}
