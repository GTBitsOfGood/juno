import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { EmailController } from './email.controller';
import {
  ApiKeyProto,
  ApiKeyProtoFile,
  EmailProto,
  EmailProtoFile,
  JwtProto,
  JwtProtoFile,
} from 'juno-proto';
import { ApiKeyMiddleware } from 'src/middleware/api_key.middleware';

const { JWT_SERVICE_NAME, JUNO_JWT_PACKAGE_NAME } = JwtProto;
const { EMAIL_SERVICE_NAME, JUNO_EMAIL_PACKAGE_NAME } = EmailProto;
const { API_KEY_SERVICE_NAME, JUNO_API_KEY_PACKAGE_NAME } = ApiKeyProto;

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
      {
        name: EMAIL_SERVICE_NAME,
        transport: Transport.GRPC,
        options: {
          url: process.env.EMAIL_SERVICE_ADDR,
          package: JUNO_EMAIL_PACKAGE_NAME,
          protoPath: EmailProtoFile,
        },
      },
    ]),
  ],
  controllers: [EmailController],
})
export class EmailModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(ApiKeyMiddleware).forRoutes('email/*');
  }
}
