import {
  Controller,
  Inject,
  OnModuleInit,
  Post,
  Get,
  Put,
  Delete,
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
  async getCounterById(id: string): Promise<CounterResponse> {
    const counter = await this.counterService.getCounter({ id });
    return new CounterResponse(counter);
  }

  @Delete(':id')
  async resetCounter(id: string): Promise<CounterResponse> {
    const counter = await this.counterService.resetCounter({ id });
    return new CounterResponse(counter);
  }
  @Post(':id')
  async incrementCounter(id: string): Promise<CounterResponse> {
    const counter = await this.counterService.incrementCounter({ id });
    return new CounterResponse(counter);
  }
  @Post(':id')
  async decrementCounter(id: string): Promise<CounterResponse> {
    const counter = await this.counterService.decrementCounter({ id });
    return new CounterResponse(counter);
  }
}
