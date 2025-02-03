import { Module } from '@nestjs/common';
import { CounterService } from './counter.service';
import { CounterController } from './counter.controller';
import { PrismaService } from 'src/prisma.service';

@Module({
  providers: [CounterService, PrismaService],
  controllers: [CounterController],
})
export class CounterModule {}
