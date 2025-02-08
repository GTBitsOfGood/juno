import {
  Controller,
  Inject,
  OnModuleInit,
  Get,
  Post,
  Put,
} from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { CounterResponse } from 'src/models/counter.dto';
import { CounterProto } from 'juno-proto';

const { COUNTER_SERVICE_NAME } = CounterProto;

@Controller('counter')
export class CounterController implements OnModuleInit {
  private counterService: CounterProto.CounterServiceClient;

  constructor(
    @Inject(COUNTER_SERVICE_NAME) private counterClient: ClientGrpc,
  ) {}

  onModuleInit() {
    this.counterService =
      this.counterClient.getService<CounterProto.CounterServiceClient>(
        COUNTER_SERVICE_NAME,
      );
  }

  @Post(':id')
  async createCounter(id: string): Promise<CounterResponse> {
    const counter = this.counterService.createCounter({ id });
    return new CounterResponse(await lastValueFrom(counter));
  }

  @Put(':id/increment')
  async incrementCounter(id: string): Promise<CounterResponse> {
    const counter = this.counterService.incrementCounter({ id });
    return new CounterResponse(await lastValueFrom(counter));
  }

  @Put(':id/decrement')
  async decrementCounter(id: string): Promise<CounterResponse> {
    const counter = this.counterService.decrementCounter({ id });
    return new CounterResponse(await lastValueFrom(counter));
  }
  
  @Put(':id/reset')
  async resetCounter(id: string): Promise<CounterResponse> {
    const counter = this.counterService.resetCounter({ id });
    return new CounterResponse(await lastValueFrom(counter));
  }

  @Get(':id')
  async getCounter(id: string): Promise<CounterResponse> {
    const counter = this.counterService.getCounter({ id });
    return new CounterResponse(await lastValueFrom(counter));
  }
}
