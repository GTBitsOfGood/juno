import { Module } from '@nestjs/common';
import { EmailController } from './email.controller';
import { EmailService } from './email.service';
import { SendGridService } from 'src/sendgrid.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { EmailProto, EmailProtoFile } from 'juno-proto';

const { EMAIL_DB_SERVICE_NAME, JUNO_EMAIL_PACKAGE_NAME } = EmailProto;

@Module({
  imports: [
    ClientsModule.register([
      {
        name: EMAIL_DB_SERVICE_NAME,
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
  providers: [EmailService, SendGridService],
})
export class EmailModule {}
