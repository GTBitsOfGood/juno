import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LoggingModule } from './modules/logging/logging.module';

@Module({
  imports: [LoggingModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
