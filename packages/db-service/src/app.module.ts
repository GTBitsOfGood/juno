import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './modules/user/user.module';
import { ProjectModule } from './modules/project/project.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [UserModule, ProjectModule, HealthModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
