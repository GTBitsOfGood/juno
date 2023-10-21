import { Module } from '@nestjs/common';
import { ApiKeyController } from './api_key.controller';

@Module({
  controllers: [ApiKeyController],
})
export class ApiKeyModule {}
