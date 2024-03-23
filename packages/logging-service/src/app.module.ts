import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LoggingModule } from './modules/logging/logging.module';
import { ClientsModule, Transport } from '@nestjs/microservices';
import * as path from 'path';

@Module({
  imports: [
    LoggingModule,
    ClientsModule.register([
      {
        name: 'LOGGING_SERVICE',
        transport: Transport.GRPC,
        options: {
          package: 'error_logging',
          protoPath: path.join(
            __dirname,
            '../../',
            'juno-proto/dist/definitions',
            'error_loggin.proto',
          ),
        },
      },
    ]),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
