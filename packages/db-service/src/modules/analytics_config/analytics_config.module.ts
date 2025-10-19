import { Module } from '@nestjs/common';
import { AnalyticsConfigDbController } from './analytics_config.controller';
import { AnalyticsConfigService } from './analytics_config.service';
import { PrismaService } from 'src/prisma.service';

@Module({
  controllers: [AnalyticsConfigDbController],
  providers: [AnalyticsConfigService, PrismaService],
})
export class AnalyticsConfigModule {}
