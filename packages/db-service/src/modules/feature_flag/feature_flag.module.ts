import { Module } from '@nestjs/common';
import { FeatureFlagController } from './feature_flag.controller';
import { FeatureFlagService } from './feature_flag.service';
import { PrismaService } from 'src/prisma.service';

@Module({
  providers: [FeatureFlagService, PrismaService],
  controllers: [FeatureFlagController],
})
export class FeatureFlagModule {}
