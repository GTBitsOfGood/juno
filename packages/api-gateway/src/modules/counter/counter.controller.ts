import {
  Controller,
  Inject,
  OnModuleInit,
  Get,
  Patch,
  Param,
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
  async getCounterById(@Param('id') id: string): Promise<CounterResponse> {
    //Super jank, { id:{id: id} } because returnin
    const counter = await lastValueFrom(
      this.counterService.getCounter({ id: { id: id } }),
    );
    return new CounterResponse(counter);
  }

  @Delete(':id')
  async resetCounter(@Param('id') id: string): Promise<CounterResponse> {
    const counter = await lastValueFrom(
      this.counterService.resetCounter({ id: { id: id } }),
    );
    return new CounterResponse(counter);
  }
  @Patch('increment/:id')
  async incrementCounter(@Param('id') id: string): Promise<CounterResponse> {
    const counter = await lastValueFrom(
      this.counterService.incrementCounter({ id: { id: id } }),
    );
    return new CounterResponse(counter);
  }
  @Patch('decrement/:id')
  async decrementCounter(@Param('id') id: string): Promise<CounterResponse> {
    const counter = await lastValueFrom(
      this.counterService.decrementCounter({ id: { id: id } }),
    );
    return new CounterResponse(counter);
  }
}
