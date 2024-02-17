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
import { UserController } from './user.controller';
import { UserProto, UserProtoFile } from 'juno-proto';

const { USER_SERVICE_NAME, DBSERVICE_USER_PACKAGE_NAME } = UserProto;

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: join(__dirname, '../../../../../.env.local'),
    }),
    ClientsModule.register([
      {
        name: USER_SERVICE_NAME,
        transport: Transport.GRPC,
        options: {
          url: process.env.DB_SERVICE_ADDR,
          package: DBSERVICE_USER_PACKAGE_NAME,
          protoPath: UserProtoFile,
        },
      },
    ]),
  ],
  controllers: [UserController],
})
export class UserModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(ProjectLinkingMiddleware)
      .forRoutes({ path: 'user/id/:id/project', method: RequestMethod.PUT });
  }
}
