import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import {
  CounterProto,
  CounterProtoFile,
  ProjectProto,
  ProjectProtoFile,
} from 'juno-proto';
import { join } from 'path';
import { CounterController } from './counter.controller';

const { COUNTER_SERVICE_NAME, JUNO_COUNTER_PACKAGE_NAME } = CounterProto;
const { PROJECT_SERVICE_NAME, JUNO_PROJECT_PACKAGE_NAME } = ProjectProto;

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: join(__dirname, '../../../../../.env.local'),
    }),
    ClientsModule.register([
      {
        name: COUNTER_SERVICE_NAME,
        transport: Transport.GRPC,
        options: {
          url: process.env.DB_SERVICE_ADDR,
          package: JUNO_COUNTER_PACKAGE_NAME,
          protoPath: CounterProtoFile,
        },
      },
      {
        name: PROJECT_SERVICE_NAME,
        transport: Transport.GRPC,
        options: {
          url: process.env.DB_SERVICE_ADDR,
          package: JUNO_PROJECT_PACKAGE_NAME,
          protoPath: ProjectProtoFile,
        },
      },
    ]),
  ],
  controllers: [CounterController],
})
export class CounterModule {}
