import { MiddlewareConsumer, Module } from '@nestjs/common';
import { DomainController } from './domain.controller';
import { ProjectLinkingMiddleware } from 'src/middleware/project.middleware';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { ConfigModule } from '@nestjs/config';
import {
  DomainProto,
  DomainProtoFile,
  JwtProto,
  JwtProtoFile,
} from 'juno-proto';

const { JWT_SERVICE_NAME, JUNO_JWT_PACKAGE_NAME } = JwtProto;
const { DOMAIN_SERVICE_NAME, JUNO_DOMAIN_PACKAGE_NAME } = DomainProto;
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
        name: DOMAIN_SERVICE_NAME,
        transport: Transport.GRPC,
        options: {
          url: process.env.DOMAIN_SERVICE_ADDR,
          package: JUNO_DOMAIN_PACKAGE_NAME,
          protoPath: DomainProtoFile,
        },
      },
    ]),
  ],
  controllers: [DomainController],
})
export class DomainModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(ProjectLinkingMiddleware).forRoutes('domain/*');
  }
}
