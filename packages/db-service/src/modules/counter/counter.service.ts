import { Injectable } from '@nestjs/common';
import { Prisma, Counter } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class CounterService {
  constructor(private prisma: PrismaService) {}

  async updateCounter(
    counter: Prisma.CounterWhereUniqueInput,
    update: Prisma.IntFieldUpdateOperationsInput,
  ): Promise<Counter> {
    return this.prisma.counter.update({
      where: counter,
      data: {
        value: update,
      },
    });
  }

  async getCounter(counter: Prisma.CounterWhereUniqueInput): Promise<Counter> {
    return this.prisma.counter.findUnique({
      where: counter,
    });
  }
}
