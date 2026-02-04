import { status } from '@grpc/grpc-js';
import { Controller } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { CounterProto } from 'juno-proto';
import { CounterService } from './counter.service';

@Controller()
@CounterProto.CounterServiceControllerMethods()
export class CounterDbController
  implements CounterProto.CounterServiceController
{
  constructor(private readonly counterService: CounterService) {}

  async incrementCounter(
    request: CounterProto.IncrementCounterRequest,
  ): Promise<CounterProto.IncrementCounterResponse> {
    try {
      const counter = await this.counterService.incrementCounter(request);
      return counter;
    } catch (e) {
      throw new RpcException({
        code: status.INTERNAL,
        message: 'Failed to increment counter',
      });
    }
  }
  async decrementCounter(
    request: CounterProto.DecrementCounterRequest,
  ): Promise<CounterProto.DecrementCounterResponse> {
    try {
      const counter = await this.counterService.decrementCounter(request);
      return counter;
    } catch (e) {
      throw new RpcException({
        code: status.INTERNAL,
        message: 'Failed to decrement counter',
      });
    }
  }
  async resetCounter(
    request: CounterProto.ResetCounterRequest,
  ): Promise<CounterProto.ResetCounterResponse> {
    try {
      const counter = await this.counterService.resetCounter(request);
      return counter;
    } catch (e) {
      throw new RpcException({
        code: status.INTERNAL,
        message: 'Failed to reset counter',
      });
    }
  }
  async getCounter(
    request: CounterProto.GetCounterRequest,
  ): Promise<CounterProto.GetCounterResponse> {
    // design decision: if counter with id in the request body does not exist,
    // return a default value of 0
    try {
      const counter = await this.counterService.getCounter(request);
      return counter;
    } catch (e) {
      throw new RpcException({
        code: status.INTERNAL,
        message: 'Failed to get counter',
      });
    }
  }
}
