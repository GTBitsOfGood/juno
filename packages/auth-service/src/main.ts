import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.GRPC,
      options: {
        package: ['authservice.api_key', 'authservice.jwt'],
        protoPath: [
          join(__dirname, '../../proto/auth-service/api_key.proto'),
          join(__dirname, '../../proto/auth-service/jwt.proto'),
        ],
        url: '0.0.0.0:50052',
      },
    },
  );
  await app.listen();
}
bootstrap();
