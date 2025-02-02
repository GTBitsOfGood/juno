import { Controller } from '@nestjs/common';
import { CounterProto } from 'juno-proto';
import { CounterService } from './counter.service';

@Controller()
@CounterProto.CounterServiceControllerMethods()
export class CounterController {
  constructor(private readonly counterService: CounterService) {}

  async incrementCounter(request: CounterProto.IncrementCounterRequest): Promise<CounterProto.Counter> {
    const { id } = request;
    const counter = await this.counterService.incrementCounter(id);
    return { id: counter.id, value: counter.value };
  }

  async decrementCounter(request: CounterProto.DecrementCounterRequest): Promise<CounterProto.Counter> {
    const { id } = request;
    const counter = await this.counterService.decrementCounter(id);
    return { id: counter.id, value: counter.value };
  }

  async resetCounter(request: CounterProto.ResetCounterRequest): Promise<CounterProto.Counter> {
    const { id } = request;
    const counter = await this.counterService.resetCounter(id);
    return { id: counter.id, value: counter.value };
  }

  async getCounter(request: CounterProto.GetCounterRequest): Promise<CounterProto.Counter> {
    const { id } = request;
    const counter = await this.counterService.getCounter(id);
    return { id: counter.id, value: counter.value };
  }

}
