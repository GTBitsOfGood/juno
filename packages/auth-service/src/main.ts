import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { AUTHSERVICE_API_KEY_PACKAGE_NAME } from './gen/api_key';
import { AUTHSERVICE_JWT_PACKAGE_NAME } from './gen/jwt';
import { ConfigModule } from '@nestjs/config';

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
          AUTHSERVICE_API_KEY_PACKAGE_NAME,
          AUTHSERVICE_JWT_PACKAGE_NAME,
        ],
        protoPath: [
          join(__dirname, '../../proto/auth-service/api_key.proto'),
          join(__dirname, '../../proto/auth-service/jwt.proto'),
        ],
        url: process.env.AUTH_SERVICE_ADDR,
      },
    },
  );
  await app.listen();
}
bootstrap();
