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

  /**
   * Increment the value of a counter
   * @param request
   * @returns the counter ID and the updated value of the counter
   */
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

  /**
   * Decrement the value of a counter
   * @param request
   * @returns the counter ID and updated value
   */
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

  /**
   * Reset the value of a counter to zero
   * @param request
   * @returns the counter ID and updated value
   */
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

  /**
   * Get the current value of a counter
   * @param request
   * @returns the counter's value or 0 if the counter does not exist
   */
  async getCounter(
    request: CounterProto.GetCounterRequest,
  ): Promise<CounterProto.GetCounterResponse> {
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
