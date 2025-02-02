import { Controller } from '@nestjs/common';
import { CounterService } from './counter.service';
import { CounterProto } from 'juno-proto';
@Controller('counter')
@CounterProto.CounterDbServiceControllerMethods()
export class CounterController implements CounterProto.CounterController {
  constructor(private readonly counterService: CounterService) {}

  async incrementCounter(
    req: CounterProto.IncrementCounterRequest,
  ): Promise<CounterProto.IncrementCounterResponse> {
    const counter = await this.counterService.incrementCounter(req.id);

    return { value: counter.value };
  }

  async decrementCounter(
    req: CounterProto.DecrmentCounterRequest,
  ): Promise<CounterProto.DecrementCounterResponse> {
    const counter = await this.counterService.decrementCounter(req.id);

    return { value: counter.value };
  }
  async resetCounter(
    req: CounterProto.ResetCounterRequest,
  ): Promise<CounterProto.ResetCounterResponse> {
    const counter = await this.counterService.resetCounter(req.id);
    return { value: counter.value };
  }
  async getCounter(
    req: CounterProto.GetCounterRequest,
  ): Promise<CounterProto.GetCounterResponse> {
    const counter = await this.counterService.getCounter(req.id);
    return { value: counter.value };
  }
}
