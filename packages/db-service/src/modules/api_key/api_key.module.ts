import { Module } from '@nestjs/common';
import { ApiKeyController } from './api_key.controller';
import { ApiKeyService } from './api_key.service';
import { PrismaService } from 'src/prisma.service';

@Module({
  controllers: [ApiKeyController],
  providers: [ApiKeyService, PrismaService],
})
export class ProjectModule {}
