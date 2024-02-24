import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { ProjectController } from './project.controller';
import {
  ProjectProto,
  ProjectProtoFile,
  UserProto,
  UserProtoFile,
} from 'juno-proto';
import { CredentialsMiddleware } from 'src/middleware/credentials.middleware';

const { USER_AUTH_SERVICE_NAME, JUNO_USER_PACKAGE_NAME } = UserProto;
const { PROJECT_SERVICE_NAME, JUNO_PROJECT_PACKAGE_NAME } = ProjectProto;

// TODO: Make this module Auth protected
@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: join(__dirname, '../../../../../.env.local'),
    }),
    ClientsModule.register([
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
      .apply(CredentialsMiddleware)
      .forRoutes(
        { path: 'user', method: RequestMethod.POST },
        { path: 'user/type', method: RequestMethod.POST },
      );
  }
}
