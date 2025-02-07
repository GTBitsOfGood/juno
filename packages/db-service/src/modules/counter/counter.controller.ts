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
  ): Promise<CounterProto.IncrementCounterResponse> {
    const data = await this.counterService.incrementCounter(request.counterId);
    return { value: data.value };
  }

  async decrementCounter(
    request: CounterProto.DecrementCounterRequest,
  ): Promise<CounterProto.DecrementCounterResponse> {
    const data = await this.counterService.decrementCounter(request.counterId);
    return { value: data.value };
  }

  async resetCounter(
    request: CounterProto.ResetCounterRequest,
  ): Promise<CounterProto.ResetCounterResponse> {
    const data = await this.counterService.resetCounter(request.counterId);
    return { value: data.value };
  }

  async getCounter(
    request: CounterProto.GetCounterRequest,
  ): Promise<CounterProto.GetCounterResponse> {
    console.log(
      `Received getCounter request for counterId: ${request.counterId}`,
    );
    return { value: 0 };
    const data = await this.counterService.getCounter(request.counterId);
    return { value: data.value };
  }
}
