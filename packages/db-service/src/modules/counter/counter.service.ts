import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { Counter } from '@prisma/client';
import { CounterProto } from 'juno-proto';

@Injectable()
export class CounterService {
  constructor(private prisma: PrismaService) {}

  async getCounter(req: CounterProto.GetCounterRequest): Promise<Counter> {
    return await this.prisma.counter.findUnique({
      where: {
        id: req.id,
      },
    });
  }

  async incrementCounter(
    req: CounterProto.IncrementCounterRequest,
  ): Promise<Counter> {
    const counterData = await this.prisma.counter.findUnique({
      where: {
        id: req.id,
      },
    });

    return await this.prisma.counter.update({
      where: {
        id: req.id,
      },
      data: { ...counterData, value: ++counterData.value },
    });
  }

  async decrementCounter(
    req: CounterProto.DecrementCounterRequest,
  ): Promise<Counter> {
    const counterData = await this.prisma.counter.findUnique({
      where: {
        id: req.id,
      },
    });

    return await this.prisma.counter.update({
      where: {
        id: req.id,
      },
      data: { ...counterData, value: --counterData.value },
    });
  }

  async resetCounter(req: CounterProto.ResetCounterRequest): Promise<Counter> {
    return await this.prisma.counter.update({
      where: {
        id: req.id,
      },
      data: { id: req.id, value: 0 },
    });
  }
}
