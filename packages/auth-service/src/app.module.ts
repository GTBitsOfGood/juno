import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { KeysModule } from './modules/keys/keys.module';
import { JwtModule } from './modules/jwt/jwt.module';

@Module({
  imports: [KeysModule, JwtModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
