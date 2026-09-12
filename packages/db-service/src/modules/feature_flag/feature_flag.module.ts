import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { FeatureFlagController } from './feature_flag.controller';
import { FeatureFlagService } from './feature_flag.service';

@Module({
  imports: [],
  controllers: [FeatureFlagController],
  providers: [FeatureFlagService, PrismaService],
})
export class FeatureFlagModule {}
