import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { ProjectModule } from './modules/project/project.module';
import { UserModule } from './modules/user/user.module';
import { EmailModule } from './modules/email/email.module';
import { SentryModule } from '@sentry/nestjs/setup';
import { FileProviderAPIModule } from './modules/file_provider/file_provider.module';

@Module({
  imports: [
    SentryModule.forRoot(),
    AuthModule,
    ProjectModule,
    UserModule,
    EmailModule,
    FileProviderAPIModule,
  ],
})
export class AppModule {}
