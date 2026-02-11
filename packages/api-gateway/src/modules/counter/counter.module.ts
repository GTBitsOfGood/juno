import {
  Module,
  NestModule,
  RequestMethod,
  MiddlewareConsumer,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { CounterController } from './counter.controller';
import {
  JwtProto,
  JwtProtoFile,
  ApiKeyProto,
  ApiKeyProtoFile,
  CounterProto,
  CounterProtoFile,
} from 'juno-proto';
import { ApiKeyMiddleware } from 'src/middleware/api_key.middleware';

const { COUNTER_SERVICE_NAME, JUNO_DB_SERVICE_COUNTER_PACKAGE_NAME } =
  CounterProto;
const { JWT_SERVICE_NAME, JUNO_JWT_PACKAGE_NAME } = JwtProto;
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
        name: COUNTER_SERVICE_NAME,
        transport: Transport.GRPC,
        options: {
          url: process.env.DB_SERVICE_ADDR,
          package: JUNO_DB_SERVICE_COUNTER_PACKAGE_NAME,
          protoPath: CounterProtoFile,
        },
      },
    ]),
  ],
  controllers: [CounterController],
})
export class CounterModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(ApiKeyMiddleware)
      .forRoutes(
        { path: 'counter/:id', method: RequestMethod.GET },
        { path: 'counter/:id/increment', method: RequestMethod.PATCH },
        { path: 'counter/:id/decrement', method: RequestMethod.PATCH },
        { path: 'counter/:id/reset', method: RequestMethod.PATCH },
      );
  }
}
