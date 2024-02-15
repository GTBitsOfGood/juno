import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { EmailController } from './email.controller';
import { EmailProto, EmailProtoFile } from 'juno-proto';

const { EMAIL_SERVICE_NAME, DBSERVICE_EMAIL_PACKAGE_NAME } = EmailProto;

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: join(__dirname, '../../../../../.env.local'),
    }),
    ClientsModule.register([
      {
        name: EMAIL_SERVICE_NAME,
        transport: Transport.GRPC,
        options: {
          url: process.env.DB_SERVICE_ADDR,
          package: DBSERVICE_EMAIL_PACKAGE_NAME,
          protoPath: EmailProtoFile,
        },
      },
    ]),
  ],
  controllers: [EmailController],
})
export class EmailModule {}
