import {
  Module,
  NestModule,
  MiddlewareConsumer,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { CounterController } from './counter.controller';
import {
  CounterProto,
  CounterProtoFile
} from 'juno-proto';
import { ApiKeyMiddleware } from 'src/middleware/api_key.middleware';

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
// export class CounterModule implements NestModule {
//   configure(consumer: MiddlewareConsumer) {
//     consumer.apply(ApiKeyMiddleware).forRoutes('counter/*');
//   }
// } don't think its necessary?