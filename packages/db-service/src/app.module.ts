import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './modules/user/user.module';
import { ProjectModule } from './modules/project/project.module';
import { HealthModule } from './modules/health/health.module';
import { ResetModule } from './modules/reset/reset.module';
import { AuthModule } from './modules/auth/auth.module';
import { EmailModule } from './modules/email/email.module';
import { SentryModule } from '@sentry/nestjs/setup';
import { FileBucketModule } from './modules/file_bucket/file_bucket.module';

@Module({
  imports: [
    SentryModule.forRoot(),
    UserModule,
    ProjectModule,
    HealthModule,
    ResetModule,
    AuthModule,
    EmailModule,
    FileBucketModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
