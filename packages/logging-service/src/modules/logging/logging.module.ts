import { Module } from '@nestjs/common';
import { LoggingController } from './logging.controller';
import { LoggingService } from './logging.service';

@Module({
  controllers: [LoggingController],
  providers: [LoggingService],
})
export class LoggingModule {}
