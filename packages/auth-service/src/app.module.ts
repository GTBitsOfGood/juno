import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { JwtModule } from './modules/jwt/jwt.module';
import { ApiKeyModule } from './modules/api_key/api_key.module';

@Module({
  imports: [ApiKeyModule, JwtModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
