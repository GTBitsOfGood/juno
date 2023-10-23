import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import {
  DBSERVICE_USER_PACKAGE_NAME,
  USER_SERVICE_NAME,
} from 'src/db-service/gen/user';
import { UserController } from './user.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: join(__dirname, '../../../../../.env.local'),
    }),
    ClientsModule.register([
      {
        name: USER_SERVICE_NAME,
        transport: Transport.GRPC,
        options: {
          url: process.env.DB_SERVICE_ADDR,
          package: DBSERVICE_USER_PACKAGE_NAME,
          protoPath: join(__dirname, '../../../../proto/db-service/user.proto'),
        },
      },
    ]),
  ],
  controllers: [UserController],
})
export class UserModule {}
