import { Controller } from '@nestjs/common';
import { CounterProto } from 'juno-proto';
import { CounterService } from './counter.service';

@Controller()
@CounterProto.CounterServiceControllerMethods()
export class CounterController
  implements CounterProto.CounterServiceController
{
  constructor(private readonly counterService: CounterService) {}

  async incrementCounter(
    request: CounterProto.IncrementCounterRequest,
  ): Promise<CounterProto.CounterResponse> {
    const { counterId, amount } = request;
    return this.counterService.incrementCounter({ id: counterId }, amount);
  }

  async decrementCounter(
    request: CounterProto.DecrementCounterRequest,
  ): Promise<CounterProto.CounterResponse> {
    const { counterId, amount } = request;
    return this.counterService.decrementCounter({ id: counterId }, amount);
  }

  async getCounter(
    request: CounterProto.GetCounterRequest,
  ): Promise<CounterProto.CounterResponse> {
    const { counterId } = request;
    return this.counterService.getCounter({ id: counterId });
  }

  async resetCounter(
    request: CounterProto.ResetCounterRequest,
  ): Promise<CounterProto.CounterResponse> {
    const { counterId } = request;
    return this.counterService.resetCounter({ id: counterId });
  }
}
