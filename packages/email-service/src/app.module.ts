import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EmailModule } from './modules/email/email.module';
import { SentryModule } from '@sentry/nestjs/setup';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [SentryModule.forRoot(), EmailModule, HealthModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
