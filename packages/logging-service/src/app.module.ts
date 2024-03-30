import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LoggingModule } from './modules/logging/logging.module';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { JUNO_LOGGING_PACKAGE_NAME } from 'juno-proto/dist/gen/logging';
import { LoggingProtoFile } from 'juno-proto';

@Module({
  imports: [
    LoggingModule,
    ClientsModule.register([
      {
        name: 'LOGGING_SERVICE',
        transport: Transport.GRPC,
        options: {
          package: JUNO_LOGGING_PACKAGE_NAME,
          protoPath: [LoggingProtoFile],
        },
      },
    ]),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
