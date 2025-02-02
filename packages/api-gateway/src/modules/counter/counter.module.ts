import { Module } from '@nestjs/common';
import { CounterController } from './counter.controller';
import { ConfigModule } from '@nestjs/config';
import { join } from 'path';
import { CounterProto, CounterProtoFile } from 'juno-proto';
import { ClientsModule, Transport } from '@nestjs/microservices';

const { JUNO_COUNTER_PACKAGE_NAME, COUNTER_SERVICE_NAME } = CounterProto;

//Gonna keep these endpoints unathenticated I guess
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
