import {
  Module,
  NestModule,
  RequestMethod,
  MiddlewareConsumer,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { ProjectController } from './project.controller';
import {
  ProjectProto,
  ProjectProtoFile,
  JwtProto,
  JwtProtoFile,
  UserProto,
  UserProtoFile,
  ApiKeyProto,
  ApiKeyProtoFile,
} from 'juno-proto';
import { CredentialsMiddleware } from 'src/middleware/credentials.middleware';
import { ApiKeyMiddleware } from 'src/middleware/api_key.middleware';

const { USER_AUTH_SERVICE_NAME, JUNO_USER_PACKAGE_NAME } = UserProto;
const { PROJECT_SERVICE_NAME, JUNO_PROJECT_PACKAGE_NAME } = ProjectProto;
const { JWT_SERVICE_NAME, JUNO_JWT_PACKAGE_NAME } = JwtProto;
const { API_KEY_SERVICE_NAME, JUNO_API_KEY_PACKAGE_NAME } = ApiKeyProto;

// TODO: Make this module Auth protected
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
        name: PROJECT_SERVICE_NAME,
        transport: Transport.GRPC,
        options: {
          url: process.env.DB_SERVICE_ADDR,
          package: JUNO_PROJECT_PACKAGE_NAME,
          protoPath: ProjectProtoFile,
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
    ]),
  ],
  controllers: [ProjectController],
})
export class ProjectModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(ApiKeyMiddleware)
      .forRoutes(
        { path: 'project/id/:id/user', method: RequestMethod.PUT },
        { path: 'project/name/:name/user', method: RequestMethod.PUT },
      );
    consumer
      .apply(CredentialsMiddleware)
      .forRoutes(
        { path: 'project', method: RequestMethod.POST },
        { path: 'project', method: RequestMethod.GET },
        { path: 'project/:id/users', method: RequestMethod.GET },
        { path: 'project/id/:id', method: RequestMethod.DELETE },
      );
  }
}
