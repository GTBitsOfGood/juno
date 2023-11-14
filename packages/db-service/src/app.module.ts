import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './modules/user/user.module';
import { ProjectModule } from './modules/project/project.module';
import { ApiKeyModule } from './modules/api_key/api_key.module';

@Module({
  imports: [UserModule, ProjectModule, ApiKeyModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
