import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { Counter } from '@prisma/client';

@Injectable()
export class CounterService {
  constructor(private prisma: PrismaService) {}

  async incrementCounter(id: string): Promise<Counter> {
    return await this.prisma.counter.upsert({
      where: { id },
      create: { id, value: 1 },
      update: { value: { increment: 1 } },
    });
  }

  async decrementCounter(id: string): Promise<Counter> {
    return await this.prisma.counter.upsert({
      where: { id },
      create: { id, value: -1 },
      update: { value: { decrement: 1 } },
    });
  }

  async resetCounter(id: string): Promise<Counter> {
    return await this.prisma.counter.update({
      where: { id },
      data: { value: 0 },
    });
  }

  async getCounter(id: string): Promise<Counter | null> {
    return await this.prisma.counter.findUnique({
      where: { id },
    });
  }
}
