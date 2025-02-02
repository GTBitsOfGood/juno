import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class CounterService {
  constructor(private prisma: PrismaService) {}
  //incrementCounter, decrementCounter, resetCounter, getCounter

  async incrementCounter(id: string) {
    return await this.prisma.counter.update({
      where: { id: id },
      data: { value: { increment: 1 } },
    });
  }

  async decrementCounter(id: string) {
    return await this.prisma.counter.update({
      where: { id: id },
      data: { value: { decrement: 1 } },
    });
  }

  async resetCounter(id: string) {
    return await this.prisma.counter.update({
      where: { id: id },
      data: { value: 0 },
    });
  }

  async getCounter(id: string) {
    //Get counter will create a counter if not found.
    const counter = await this.prisma.counter.findUnique({ where: { id: id } });

    if (counter == null) {
      return await this.prisma.counter.create({ data: { id: id, value: 0 } });
    } else {
      return counter;
    }
  }
}
