import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SentryModule } from '@sentry/nestjs/setup';
import { HealthModule } from './modules/health/health.module';
import { FileUploadModule } from './modules/file_upload/file_upload.module';
import { FileProviderModule } from './modules/file_provider/file_provider.module';
import { FileBucketModule } from './modules/file_bucket/file_bucket.module';

@Module({
  imports: [
    SentryModule.forRoot(),
    HealthModule,
    FileUploadModule,
    FileProviderModule,
    FileBucketModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
