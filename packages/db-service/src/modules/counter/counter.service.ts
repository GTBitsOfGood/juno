import { Injectable } from '@nestjs/common';
import { Counter } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class CounterService {
  constructor(private prisma: PrismaService) {}

  async createCounter(id: string, initialValue: number = 0): Promise<Counter> {
    return this.prisma.counter.create({
      data: { id, value: initialValue },
    });
  }

  async getCounter(id: string): Promise<Counter | null> {
    return this.prisma.counter.findUnique({
      where: { id },
    });
  }

  async incrementCounter(id: string): Promise<Counter> {
    return this.prisma.counter.upsert({
      where: { id },
      create: { id, value: 1 },
      update: { value: { increment: 1 } },
    });
  }

  async decrementCounter(id: string): Promise<Counter> {
    return this.prisma.counter.upsert({
      where: { id },
      create: { id, value: -1 },
      update: { value: { decrement: 1 } },
    });
  }

  async resetCounter(id: string): Promise<Counter> {
    return this.prisma.counter.upsert({
      where: { id },
      create: { id, value: 0 },
      update: { value: 0 },
    });
  }
}
