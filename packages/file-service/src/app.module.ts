import { Module } from '@nestjs/common';
import { SentryModule } from '@sentry/nestjs/setup';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FileBucketModule } from './modules/file_bucket/file_bucket.module';
import { FileConfigModule } from './modules/file_config/file_config.module';
import { FileProviderModule } from './modules/file_provider/file_provider.module';
import { FileUploadModule } from './modules/file_transfer/file_upload.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    SentryModule.forRoot(),
    HealthModule,
    FileUploadModule,
    FileProviderModule,
    FileBucketModule,
    FileConfigModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
