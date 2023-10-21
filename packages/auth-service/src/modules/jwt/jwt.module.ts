import { Module } from '@nestjs/common';
import { JWTController } from './jwt.controller';

@Module({
  controllers: [JWTController],
})
export class JwtModule {}
