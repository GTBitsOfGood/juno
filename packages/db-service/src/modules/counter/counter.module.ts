import { Module } from '@nestjs/common';
import { CounterController } from './counter.controller';

@Module({
  controllers: [CounterController]
})
export class CounterModule {}
