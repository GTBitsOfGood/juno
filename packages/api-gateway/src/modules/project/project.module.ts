import {
  Module,
  NestModule,
  RequestMethod,
  MiddlewareConsumer,
} from '@nestjs/common';
import { ProjectLinkingMiddleware } from '../../middleware/project.middleware';
import { ConfigModule } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { ProjectController } from './project.controller';
import {
  ProjectProto,
  ProjectProtoFile,
  JwtProto,
  JwtProtoFile,
} from 'juno-proto';

const { PROJECT_SERVICE_NAME, DBSERVICE_PROJECT_PACKAGE_NAME } = ProjectProto;
const { JWT_SERVICE_NAME, AUTHSERVICE_JWT_PACKAGE_NAME } = JwtProto;

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
          package: AUTHSERVICE_JWT_PACKAGE_NAME,
          protoPath: JwtProtoFile,
        },
      },
      {
        name: PROJECT_SERVICE_NAME,
        transport: Transport.GRPC,
        options: {
          url: process.env.DB_SERVICE_ADDR,
          package: DBSERVICE_PROJECT_PACKAGE_NAME,
          protoPath: ProjectProtoFile,
        },
      },
    ]),
  ],
  controllers: [ProjectController],
})
export class ProjectModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(ProjectLinkingMiddleware)
      .forRoutes(
        { path: 'project/id/:id/user', method: RequestMethod.PUT },
        { path: 'project/name/:name/user', method: RequestMethod.PUT },
      );
  }
}
