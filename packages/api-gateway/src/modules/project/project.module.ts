import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import {
  DBSERVICE_PROJECT_PACKAGE_NAME,
  PROJECT_SERVICE_NAME,
} from 'src/db-service/gen/project';
import { ProjectController } from './project.controller';

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
          package: DBSERVICE_PROJECT_PACKAGE_NAME,
          protoPath: join(
            __dirname,
            '../../../../proto/db-service/project.proto',
          ),
        },
      },
    ]),
  ],
  controllers: [ProjectController],
})
export class ProjectModule {}
