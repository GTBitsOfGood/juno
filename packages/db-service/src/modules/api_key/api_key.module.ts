import { Module } from '@nestjs/common';
import { ApiKeyController } from './api_key.controller';
import { ApiKeyService } from './api_key.service';

@Module({
  controllers: [ApiKeyController],
  providers: [ApiKeyService]
})
export class ApiKeyModule {}
