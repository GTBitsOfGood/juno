import {
  Body,
  Controller,
  Get,
  Inject,
  OnModuleInit,
  Param,
  Post,
} from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import {
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CounterProto } from 'juno-proto';
import { lastValueFrom } from 'rxjs';

const { COUNTER_SERVICE_NAME } = CounterProto;

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

  @Post()
  @ApiOperation({ summary: 'Create a new counter' })
  @ApiCreatedResponse({ description: 'Counter created' })
  async createCounter(
    @Body() body: { id: string; initialValue?: number },
  ): Promise<{ value: number }> {
    return lastValueFrom(
      this.counterService.createCounter({
        id: body.id,
        initialValue: body.initialValue,
      }),
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get counter value' })
  @ApiOkResponse({ description: 'Counter value retrieved' })
  @ApiNotFoundResponse({ description: 'Counter not found' })
  async getCounter(@Param('id') id: string): Promise<{ value: number }> {
    return lastValueFrom(this.counterService.getCounter({ id }));
  }

  @Post(':id/increment')
  @ApiOperation({ summary: 'Increment counter' })
  @ApiOkResponse({ description: 'Counter incremented' })
  async incrementCounter(@Param('id') id: string): Promise<{ value: number }> {
    return lastValueFrom(this.counterService.incrementCounter({ id }));
  }

  @Post(':id/decrement')
  @ApiOperation({ summary: 'Decrement counter' })
  @ApiOkResponse({ description: 'Counter decremented' })
  async decrementCounter(@Param('id') id: string): Promise<{ value: number }> {
    return lastValueFrom(this.counterService.decrementCounter({ id }));
  }

  @Post(':id/reset')
  @ApiOperation({ summary: 'Reset counter to zero' })
  @ApiOkResponse({ description: 'Counter reset' })
  async resetCounter(@Param('id') id: string): Promise<{ value: number }> {
    return lastValueFrom(this.counterService.resetCounter({ id }));
  }
}
