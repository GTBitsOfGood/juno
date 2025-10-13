import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { ProjectModule } from './modules/project/project.module';
import { UserModule } from './modules/user/user.module';
import { EmailModule } from './modules/email/email.module';
import { SentryModule } from '@sentry/nestjs/setup';
import { FileProviderModule } from './modules/file_provider/file_provider.module';
import { FileDownloadModule } from './modules/file_download/file_download.module';
import { FileUploadModule } from './modules/file_upload/file_upload.module';
import { FileBucketModule } from './modules/file_bucket/file_bucket.module';
import { FileConfigModule } from './modules/file_config/file_config.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';

@Module({
  imports: [
    SentryModule.forRoot(),
    AuthModule,
    ProjectModule,
    UserModule,
    EmailModule,
    FileProviderModule,
    FileDownloadModule,
    FileUploadModule,
    FileBucketModule,
    FileConfigModule,
    AnalyticsModule,
  ],
})
export class AppModule {}
