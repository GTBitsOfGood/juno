import { Module } from '@nestjs/common';
import { AnalyticsEventDbController } from './analytics_event.controller';
import { AnalyticsEventService } from './analytics_event.service';
import { PrismaService } from 'src/prisma.service';

@Module({
  controllers: [AnalyticsEventDbController],
  providers: [AnalyticsEventService, PrismaService],
})
export class AnalyticsEventModule {}
