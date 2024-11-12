import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SentryModule } from '@sentry/nestjs/setup';
import { HealthModule } from './modules/health/health.module';
import { FileUploadModule } from './modules/file_upload/file_upload.module';
import { FileProviderModule } from './modules/file_provider/file_provider.module';
import { FileModule } from './modules/file/file.module';

@Module({
  imports: [
    SentryModule.forRoot(),
    HealthModule,
    FileModule,
    FileUploadModule,
    FileProviderModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
