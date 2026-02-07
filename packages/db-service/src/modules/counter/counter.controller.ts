import { status } from '@grpc/grpc-js';
import { Controller } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Prisma } from '@prisma/client';
import { CounterProto } from 'juno-proto';
import { CounterService } from './counter.service';

@Controller()
@CounterProto.CounterDbServiceControllerMethods()
export class CounterController implements CounterProto.CounterDbServiceController {
  constructor(private readonly counterService: CounterService) {}

  async incrementCounter(
    request: CounterProto.IncrementCounterRequest,
  ): Promise<CounterProto.Counter> {
    try {
      const counter = await this.counterService.incrementCounter(request.id);

      return {
        id: counter.id,
        value: counter.value,
      };
    } catch (e) {
      throw new RpcException({
        code: status.FAILED_PRECONDITION,
        message: 'Failed to increment counter',
      });
    }
  }

  async decrementCounter(
    request: CounterProto.DecrementCounterRequest,
  ): Promise<CounterProto.Counter> {
    try {
      const counter = await this.counterService.decrementCounter(request.id);

      return {
        id: counter.id,
        value: counter.value,
      };
    } catch (e) {
      throw new RpcException({
        code: status.FAILED_PRECONDITION,
        message: 'Failed to decrement counter',
      });
    }
  }

  async resetCounter(
    request: CounterProto.ResetCounterRequest,
  ): Promise<CounterProto.Counter> {
    try {
      const counter = await this.counterService.resetCounter(request.id);

      return {
        id: counter.id,
        value: counter.value,
      };
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2025'
      ) {
        throw new RpcException({
          code: status.NOT_FOUND,
          message: 'Counter not found',
        });
      }
      throw new RpcException({
        code: status.FAILED_PRECONDITION,
        message: 'Failed to reset counter',
      });
    }
  }

  async getCounter(
    request: CounterProto.GetCounterRequest,
  ): Promise<CounterProto.Counter> {
    try {
      const counter = await this.counterService.getCounter(request.id);

      if (!counter) {
        throw new RpcException({
          code: status.NOT_FOUND,
          message: 'Counter not found',
        });
      }

      return {
        id: counter.id,
        value: counter.value,
      };
    } catch (error) {
      throw error;
    }
  }
}
