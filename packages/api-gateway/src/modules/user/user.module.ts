import {
  Module,
  NestModule,
  RequestMethod,
  MiddlewareConsumer,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { UserController } from './user.controller';
import {
  UserProto,
  UserProtoFile,
  JwtProto,
  JwtProtoFile,
  ProjectProto,
  ProjectProtoFile,
} from 'juno-proto';

const { JWT_SERVICE_NAME, JUNO_JWT_PACKAGE_NAME } = JwtProto;
import { CredentialsMiddleware } from 'src/middleware/credentials.middleware';

const { USER_SERVICE_NAME, USER_AUTH_SERVICE_NAME, JUNO_USER_PACKAGE_NAME } =
  UserProto;
const { PROJECT_SERVICE_NAME, JUNO_PROJECT_PACKAGE_NAME } = ProjectProto;

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
        name: USER_SERVICE_NAME,
        transport: Transport.GRPC,
        options: {
          url: process.env.DB_SERVICE_ADDR,
          package: JUNO_USER_PACKAGE_NAME,
          protoPath: UserProtoFile,
        },
      },
      {
        name: USER_AUTH_SERVICE_NAME,
        transport: Transport.GRPC,
        options: {
          url: process.env.AUTH_SERVICE_ADDR,
          package: JUNO_USER_PACKAGE_NAME,
          protoPath: UserProtoFile,
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
  controllers: [UserController],
})
export class UserModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(CredentialsMiddleware)
      .forRoutes(
        { path: 'user', method: RequestMethod.POST },
        { path: 'user', method: RequestMethod.GET },
        { path: 'user/type', method: RequestMethod.POST },
        { path: 'user/id/:id/project', method: RequestMethod.PUT },
      );
  }
}
