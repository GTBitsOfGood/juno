import { Module } from '@nestjs/common';
import { CounterController } from './counter.controller';
import { CounterService } from './counter.service';
import { PrismaService } from 'src/prisma.service';

@Module({
  controllers: [CounterController],
  providers: [CounterService, PrismaService]
})
export class CounterModule {}
