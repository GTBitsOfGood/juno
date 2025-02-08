import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { Counter } from '@prisma/client';

@Injectable()
export class CounterService {
  constructor(private prisma: PrismaService) {}

  async createCounter(id: string): Promise<Counter> {
    return this.prisma.counter.create({
      data: { id: id, value: 0 },
    });
  }

  async incrementCounter(id: string): Promise<Counter> {
    return this.prisma.counter.update({
      where: { id },
      data: { value: { increment: 1 } },
    });
  }

  async decrementCounter(id: string): Promise<Counter> {
    return this.prisma.counter.update({
      where: { id },
      data: { value: { decrement: 1 } },
    });
  }

  async resetCounter(id: string): Promise<Counter> {
    return this.prisma.counter.update({
      where: { id },
      data: { value: 0 },
    });
  }

  async getCounter(id: string): Promise<Counter> {
    return this.prisma.counter.findUnique({ where: { id } });
  }
}
