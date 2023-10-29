import { Module } from '@nestjs/common';
import { JWTController } from './jwt.controller';
import { JWTService } from './jwt.service';
import { ConfigModule } from '@nestjs/config';
import { join } from 'path';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { API_KEY_SERVICE_NAME, AUTHSERVICE_API_KEY_PACKAGE_NAME } from 'src/gen/api_key';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: join(__dirname, '../../../../.env.local'),
    }),
    ClientsModule.register([
      {
        name: API_KEY_SERVICE_NAME,
        transport: Transport.GRPC,
        options: {
          url: process.env.AUTH_SERVICE_ADDR,
          package: AUTHSERVICE_API_KEY_PACKAGE_NAME,
          protoPath: join(
            __dirname,
            '../../../../proto/auth-service/api_key.proto',
          ),
        },
      }])
  ],
  controllers: [JWTController],
  providers: [JWTService],
})
export class JwtModule { }
