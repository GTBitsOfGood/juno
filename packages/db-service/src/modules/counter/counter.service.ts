import { Injectable } from '@nestjs/common';
import { CounterProto } from 'juno-proto';
import { Counter, Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class CounterService {
  constructor(private prisma: PrismaService) {}

  async incrementCounter(
    counter: Prisma.CounterWhereUniqueInput,
    amount: number,
  ): Promise<CounterProto.CounterResponse> {
    const updatedCounter = await this.prisma.counter.upsert({
      where: counter,
      create: {
        id: counter.id!,
        count: amount,
      },
      update: {
        count: {
          increment: amount,
        },
      },
    });

    return convertDbCounterToTs(updatedCounter);
  }

  async decrementCounter(
    counter: Prisma.CounterWhereUniqueInput,
    amount: number,
  ): Promise<CounterProto.CounterResponse> {
    const updatedCounter = await this.prisma.counter.upsert({
      where: counter,
      create: {
        id: counter.id!,
        count: -amount,
      },
      update: {
        count: {
          decrement: amount,
        },
      },
    });

    return convertDbCounterToTs(updatedCounter);
  }

  async getCounter(
    counter: Prisma.CounterWhereUniqueInput,
  ): Promise<CounterProto.CounterResponse> {
    const foundCounter = await this.prisma.counter.findUnique({
      where: counter,
    });

    if (!foundCounter) {
      return {
        counterId: counter.id!,
        value: Number(0),
      };
    }
    return convertDbCounterToTs(foundCounter);
  }

  async resetCounter(
    counter: Prisma.CounterWhereUniqueInput,
  ): Promise<CounterProto.CounterResponse> {
    const updatedCounter = await this.prisma.counter.upsert({
      where: counter,
      create: {
        id: counter.id!,
        count: 0,
      },
      update: {
        count: 0,
      },
    });

    return convertDbCounterToTs(updatedCounter);
  }
}

const convertDbCounterToTs = (
  counter: Counter,
): CounterProto.CounterResponse => {
  return {
    counterId: counter.id,
    value: Number(counter.count),
  };
};
