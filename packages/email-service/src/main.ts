import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { ConfigModule } from '@nestjs/config';
import { EmailProtoFile, EmailProto } from 'juno-proto';

async function bootstrap() {
  ConfigModule.forRoot({
    envFilePath: join(__dirname, '../../../.env.local'),
  });
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.GRPC,
      options: {
        package: [EmailProto.JUNO_EMAIL_PACKAGE_NAME],
        protoPath: [EmailProtoFile],
        url: process.env.EMAIL_SERVICE_ADDR,
      },
    },
  );
  await app.listen();
}
bootstrap();
