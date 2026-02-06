import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { Counter } from '@prisma/client';
import { CounterProto } from 'juno-proto';

@Injectable()
export class CounterService {
  constructor(private prisma: PrismaService) {}

  async getCounter(req: CounterProto.GetCounterRequest): Promise<Counter> {
    const counter = await this.prisma.counter.findUnique({
      where: { id: req.id },
    });
    if (!counter) {
      return { id: req.id, value: 0 };
    }
    return counter;
  }

  async incrementCounter(
    req: CounterProto.IncrementCounterRequest,
  ): Promise<Counter> {
    return await this.prisma.counter.upsert({
      where: { id: req.id },
      create: { id: req.id, value: 1 },
      update: { value: { increment: 1 } },
    });
  }

  async decrementCounter(
    req: CounterProto.DecrementCounterRequest,
  ): Promise<Counter> {
    return await this.prisma.counter.upsert({
      where: { id: req.id },
      create: { id: req.id, value: -1 },
      update: { value: { decrement: 1 } },
    });
  }

  async resetCounter(req: CounterProto.ResetCounterRequest): Promise<Counter> {
    return await this.prisma.counter.upsert({
      where: { id: req.id },
      create: { id: req.id, value: 0 },
      update: { value: 0 },
    });
  }
}
