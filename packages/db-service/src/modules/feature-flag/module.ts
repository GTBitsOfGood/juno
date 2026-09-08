import { Module } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { FeatureFlagController } from './controller';
import { FeatureFlagService } from './service';


@Module({
  imports: [ ],
  controllers: [ FeatureFlagController ],
  providers: [ FeatureFlagService, PrismaService ],
})
export class FeatureFlagModule {}
