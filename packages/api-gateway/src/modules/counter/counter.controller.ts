import {
  Controller,
  Inject,
  OnModuleInit,
  Get,
  Put,
  Param,
  Post,
} from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { CounterProto } from 'juno-proto';
import { lastValueFrom } from 'rxjs';
import { CounterResponse } from 'src/models/counter.dto';

const { COUNTER_SERVICE_NAME } = CounterProto;

@Controller('counter')
export class CounterController implements OnModuleInit {
  private counterService: CounterProto.CounterServiceClient;

  constructor(
    @Inject(COUNTER_SERVICE_NAME) private serviceClient: ClientGrpc,
  ) {}

  onModuleInit() {
    this.counterService =
      this.serviceClient.getService<CounterProto.CounterServiceClient>(
        COUNTER_SERVICE_NAME,
      );
  }

  @Get(':id')
  async getCounterById(@Param('id') id: string): Promise<CounterResponse> {
    const counter = await lastValueFrom(
      this.counterService.getCounter({ counterId: id }),
    );
    return new CounterResponse(counter);
  }

  @Post(':value')
  async createCounter(@Param('value') value: number): Promise<CounterResponse> {
    const counter = await lastValueFrom(
      this.counterService.createCounter({ value }),
    );
    return new CounterResponse(counter);
  }

  @Put('reset/:id')
  async resetCounter(@Param('id') id: string): Promise<CounterResponse> {
    const counter = await lastValueFrom(
      this.counterService.resetCounter({ counterId: id }),
    );
    return new CounterResponse(counter);
  }
  @Put('increment/:id')
  async incrementCounter(@Param('id') id: string): Promise<CounterResponse> {
    const counter = await lastValueFrom(
      this.counterService.incrementCounter({ counterId: id }),
    );
    return new CounterResponse(counter);
  }
  @Put('decrement/:id')
  async decrementCounter(@Param('id') id: string): Promise<CounterResponse> {
    const counter = await lastValueFrom(
      this.counterService.decrementCounter({ counterId: id }),
    );
    return new CounterResponse(counter);
  }
}
