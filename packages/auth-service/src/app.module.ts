import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { JwtModule } from './modules/jwt/jwt.module';
import { ApiKeyModule } from './modules/api_key/api_key.module';
import { HealthModule } from './modules/health/health.module';
import { UserModule } from './modules/user/user.module';

@Module({
  imports: [ApiKeyModule, JwtModule, HealthModule, UserModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
