import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { join } from 'path';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { CounterProto, CounterProtoFile } from 'juno-proto';
import { CounterController } from './counter.controller';

const { COUNTER_SERVICE_NAME, JUNO_COUNTER_PACKAGE_NAME } = CounterProto;

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
    ]),
  ],
  controllers: [CounterController],
})
export class CounterModule {}
