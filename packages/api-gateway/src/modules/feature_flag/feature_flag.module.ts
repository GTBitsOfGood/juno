import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import {
  ApiKeyProto,
  ApiKeyProtoFile,
  FeatureFlagProto,
  FeatureFlagProtoFile,
  JwtProto,
  JwtProtoFile,
} from 'juno-proto';
import { ApiKeyMiddleware } from 'src/middleware/api_key.middleware';
import { FeatureFlagController } from './feature_flag.controller';

const { API_KEY_SERVICE_NAME, JUNO_API_KEY_PACKAGE_NAME } = ApiKeyProto;
const { JWT_SERVICE_NAME, JUNO_JWT_PACKAGE_NAME } = JwtProto;

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: join(__dirname, '../../../../../.env.local'),
    }),
    ClientsModule.register([
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
        name: JWT_SERVICE_NAME,
        transport: Transport.GRPC,
        options: {
          url: process.env.AUTH_SERVICE_ADDR,
          package: JUNO_JWT_PACKAGE_NAME,
          protoPath: JwtProtoFile,
        },
      },
      {
        name: FeatureFlagProto.FEATURE_FLAG_SERVICE_NAME,
        transport: Transport.GRPC,
        options: {
          url: process.env.DB_SERVICE_ADDR,
          package: FeatureFlagProto.JUNO_FEATURE_FLAG_PACKAGE_NAME,
          protoPath: FeatureFlagProtoFile,
        },
      },
    ]),
  ],
  controllers: [FeatureFlagController],
})
export class FeatureFlagModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(ApiKeyMiddleware).forRoutes('feature_flag*');
  }
}
