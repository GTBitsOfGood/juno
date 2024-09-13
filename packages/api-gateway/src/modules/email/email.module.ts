import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { EmailController } from './email.controller';
import { EmailProto, EmailProtoFile, JwtProto, JwtProtoFile } from 'juno-proto';
import { EmailLinkingMiddleware } from 'src/middleware/email.middleware';

const { JWT_SERVICE_NAME, JUNO_JWT_PACKAGE_NAME } = JwtProto;
const { EMAIL_SERVICE_NAME, JUNO_EMAIL_PACKAGE_NAME } = EmailProto;

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
    consumer.apply(EmailLinkingMiddleware).forRoutes('email/*');
  }
}
