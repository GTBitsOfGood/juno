import {
  Controller,
  Inject,
  OnModuleInit,
  Post,
  Body,
  Get,
  Query,
} from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CounterProto } from 'juno-proto';
import { COUNTER_SERVICE_NAME } from 'juno-proto/dist/gen/counter';
import { lastValueFrom } from 'rxjs';
import { CounterChangeModel, CounterResponse } from 'src/models/counter.dto';

@ApiTags('counter')
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

  @Post('/counter/increment')
  @ApiOperation({ summary: 'Increment a counter' })
  @ApiResponse({
    description: 'The counter has been incremented.',
    type: CounterChangeModel,
  })
  async incrementCounter(
    @Body() counterRequest: CounterChangeModel,
  ): Promise<CounterResponse> {
    const updatedCounter = this.counterService.incrementCounter({
      counterId: counterRequest.counterId,
      amount: counterRequest.amount,
    });

    return new CounterResponse(await lastValueFrom(updatedCounter));
  }

  @Post('/counter/decrement')
  @ApiOperation({ summary: 'Decrement a counter' })
  @ApiResponse({
    description: 'The counter has been decremented.',
    type: CounterChangeModel,
  })
  async decrementCounter(
    @Body() counterRequest: CounterChangeModel,
  ): Promise<CounterResponse> {
    const updatedCounter = this.counterService.decrementCounter({
      counterId: counterRequest.counterId,
      amount: counterRequest.amount,
    });

    return new CounterResponse(await lastValueFrom(updatedCounter));
  }

  @Get('/counter/get')
  @ApiOperation({ summary: 'Get the current value of a counter' })
  @ApiResponse({
    description: 'The current value of the counter.',
    type: CounterResponse,
  })
  async getCounter(@Query('id') counterId: string): Promise<CounterResponse> {
    const foundCounter = this.counterService.getCounter({
      counterId,
    });
    return new CounterResponse(await lastValueFrom(foundCounter));
  }

  @Post('/counter/reset')
  @ApiOperation({ summary: 'Reset a counter to zero' })
  @ApiResponse({
    description: 'The counter has been reset to zero.',
    type: CounterResponse,
  })
  async resetCounter(@Body('id') counterId: string): Promise<CounterResponse> {
    const resetCounter = this.counterService.resetCounter({
      counterId,
    });
    return new CounterResponse(await lastValueFrom(resetCounter));
  }
}
