import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class CounterService {
  constructor(private prisma: PrismaService) {}
  async createCounter(counterId: string, value: number) {
    const data = await this.prisma.counter.create({
      data: { id: counterId, value },
    });
    return data;
  }
  async incrementCounter(counterId: string) {
    const data = await this.prisma.counter.update({
      where: {
        id: counterId,
      },
      data: {
        value: {
          increment: 1,
        },
      },
    });
    return data;
  }
  async decrementCounter(counterId: string) {
    const data = await this.prisma.counter.update({
      where: {
        id: counterId,
      },
      data: {
        value: {
          decrement: 1,
        },
      },
    });
    return data;
  }
  async resetCounter(counterId: string) {
    const data = await this.prisma.counter.update({
      where: {
        id: counterId,
      },
      data: {
        value: 0,
      },
    });
    return data;
  }
  async getCounter(counterId: string) {
    const data = await this.prisma.counter.findUnique({
      where: {
        id: counterId,
      },
    });
    if (!data) {
      throw new NotFoundException('Counter not found');
    }
    return data;
  }
}
