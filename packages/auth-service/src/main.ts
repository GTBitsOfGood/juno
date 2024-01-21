import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { ConfigModule } from '@nestjs/config';
import {
  ApiKeyProto,
  JwtProto,
  ApiKeyProtoFile,
  JwtProtoFile,
} from 'juno-proto';

async function bootstrap() {
  ConfigModule.forRoot({
    envFilePath: join(__dirname, '../../../.env.local'),
  });
  console.log(process.env.AUTH_SERVICE_ADDR);
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.GRPC,
      options: {
        package: [
          ApiKeyProto.AUTHSERVICE_API_KEY_PACKAGE_NAME,
          JwtProto.AUTHSERVICE_JWT_PACKAGE_NAME,
        ],
        protoPath: [ApiKeyProtoFile, JwtProtoFile],
        url: process.env.AUTH_SERVICE_ADDR,
      },
    },
  );
  await app.listen();
}
bootstrap();
