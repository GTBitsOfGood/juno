import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { FeatureFlagService } from './feature_flag.service';
import { FeatureFlagController } from './feature_flag.controller';

@Module({
  providers: [FeatureFlagService, PrismaService],
  controllers: [FeatureFlagController],
})
export class FeatureFlagModule {}
