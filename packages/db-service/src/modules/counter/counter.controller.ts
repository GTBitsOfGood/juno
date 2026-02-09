import { Controller } from '@nestjs/common';
import { status } from '@grpc/grpc-js';
import { CounterService } from './counter.service';
import { CounterProto } from 'juno-proto';
import { RpcException } from '@nestjs/microservices';
import { validateCounterIdentifier } from '../../utility/validate';

@Controller()
@CounterProto.CounterServiceControllerMethods()
export class CounterController
  implements CounterProto.CounterServiceController
{
  constructor(private readonly counterService: CounterService) {}

  async incrementCounter(
    request: CounterProto.IncrementCounterRequest,
  ): Promise<CounterProto.Counter> {
    const validatedIdentifier = validateCounterIdentifier(request.id);
    const counter = await this.counterService.getCounter(validatedIdentifier);

    if (!counter) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: 'Counter not found',
      });
    }

    return await this.counterService.updateCounter(validatedIdentifier, {
      increment: request.value,
    });
  }

  async decrementCounter(
    request: CounterProto.DecrementCounterRequest,
  ): Promise<CounterProto.Counter> {
    const validatedIdentifier = validateCounterIdentifier(request.id);
    const counter = await this.counterService.getCounter(validatedIdentifier);

    if (!counter) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: 'Counter not found',
      });
    }

    return await this.counterService.updateCounter(validatedIdentifier, {
      decrement: request.value,
    });
  }

  async resetCounter(
    request: CounterProto.ResetCounterRequest,
  ): Promise<CounterProto.Counter> {
    const validatedIdentifier = validateCounterIdentifier(request.id);
    const counter = await this.counterService.getCounter(validatedIdentifier);

    if (!counter) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: 'Counter not found',
      });
    }

    return await this.counterService.updateCounter(validatedIdentifier, {
      set: 0,
    });
  }

  async getCounter(
    request: CounterProto.GetCounterRequest,
  ): Promise<CounterProto.Counter> {
    const validatedIdentifier = validateCounterIdentifier(request.id);
    const counter = await this.counterService.getCounter(validatedIdentifier);

    if (!counter) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: 'Counter not found',
      });
    }

    return counter;
  }
}
