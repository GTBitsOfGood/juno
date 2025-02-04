import {
  Controller,
  Inject,
  OnModuleInit,
  Get,
  Param,
  Post,
} from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { CounterProto } from 'juno-proto';
import { lastValueFrom } from 'rxjs';
import { CounterResponse } from 'src/models/counter.dto';
import { Logger } from '@nestjs/common';

const { COUNTER_SERVICE_NAME } = CounterProto;

@Controller('counter')
export class CounterController implements OnModuleInit {
  private readonly logger = new Logger(CounterController.name);
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
    this.logger.log(`Fetching counter with ID: ${id}`);
    const counter = await lastValueFrom(
      this.counterService.getCounter({ counterId: id }),
    );
    this.logger.log(`Counter fetched: ${JSON.stringify(counter)}`);
    return new CounterResponse(counter);
  }

  @Post('reset/:id')
  async resetCounter(@Param('id') id: string): Promise<CounterResponse> {
    this.logger.log(`Resetting counter with ID: ${id}`);
    const counter = await lastValueFrom(
      this.counterService.resetCounter({ counterId: id }),
    );
    this.logger.log(`Counter reset: ${JSON.stringify(counter)}`);
    return new CounterResponse(counter);
  }

  @Post('increment/:id')
  async incrementCounter(@Param('id') id: string): Promise<CounterResponse> {
    this.logger.log(`Incrementing counter with ID: ${id}`);
    const counter = await lastValueFrom(
      this.counterService.incrementCounter({ counterId: id }),
    );
    this.logger.log(`Counter incremented: ${JSON.stringify(counter)}`);
    return new CounterResponse(counter);
  }

  @Post('decrement/:id')
  async decrementCounter(@Param('id') id: string): Promise<CounterResponse> {
    this.logger.log(`Decrementing counter with ID: ${id}`);
    const counter = await lastValueFrom(
      this.counterService.decrementCounter({ counterId: id }),
    );
    this.logger.log(`Counter decremented: ${JSON.stringify(counter)}`);
    return new CounterResponse(counter);
  }
}
