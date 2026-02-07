import { Controller } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { Prisma } from '@prisma/client';
import { CounterProto } from 'juno-proto';
import { CounterService } from './counter.service';

@Controller()
@CounterProto.CounterServiceControllerMethods()
export class CounterController
  implements CounterProto.CounterServiceController
{
  constructor(private readonly counterService: CounterService) {}

  async createCounter(
    request: CounterProto.CreateCounterRequest,
  ): Promise<CounterProto.CreateCounterResponse> {
    try {
      const value =
        request.initialValue ??
        (request as { initial_value?: number }).initial_value ??
        0;
      const counter = await this.counterService.createCounter(
        request.id,
        value,
      );
      return { value: counter.value };
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new RpcException({
          code: status.ALREADY_EXISTS,
          message: 'Counter already exists',
        });
      }
      throw e;
    }
  }

  async getCounter(
    request: CounterProto.GetCounterRequest,
  ): Promise<CounterProto.GetCounterResponse> {
    const counter = await this.counterService.getCounter(request.id);
    if (!counter) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: 'Counter not found',
      });
    }
    return { value: counter.value };
  }

  async incrementCounter(
    request: CounterProto.IncrementCounterRequest,
  ): Promise<CounterProto.IncrementCounterResponse> {
    const counter = await this.counterService.incrementCounter(request.id);
    return { value: counter.value };
  }

  async decrementCounter(
    request: CounterProto.DecrementCounterRequest,
  ): Promise<CounterProto.DecrementCounterResponse> {
    const counter = await this.counterService.decrementCounter(request.id);
    return { value: counter.value };
  }

  async resetCounter(
    request: CounterProto.ResetCounterRequest,
  ): Promise<CounterProto.ResetCounterResponse> {
    const counter = await this.counterService.resetCounter(request.id);
    return { value: counter.value };
  }
}
