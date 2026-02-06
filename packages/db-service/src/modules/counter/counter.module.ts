import { Module } from '@nestjs/common';
import { CounterDbController } from './counter.controller';
import { CounterService } from './counter.service';
import { PrismaService } from 'src/prisma.service';

@Module({
  controllers: [CounterDbController],
  providers: [CounterService, PrismaService],
})
export class CounterModule {}
