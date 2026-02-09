import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Inject,
  OnModuleInit,
  Param,
  Patch,
} from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { UpdateCounterModel, CounterResponse } from 'src/models/counter.dto';
import { CounterProto } from 'juno-proto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

const { COUNTER_SERVICE_NAME } = CounterProto;

@ApiBearerAuth('API_Key')
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

  @Patch(':id/increment')
  @ApiOperation({ summary: 'Increments the counter by a given value' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Counter incremented successfully',
    type: CounterResponse,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Counter not found',
  })
  async incrementCounter(
    @Param('id') id: string,
    @Body() body: UpdateCounterModel,
  ): Promise<CounterResponse> {
    const counter = await lastValueFrom(
      this.counterService.incrementCounter({ id, value: body.value }),
    );
    return new CounterResponse(counter);
  }

  @Patch(':id/decrement')
  @ApiOperation({ summary: 'Decrements the counter by a given value' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Counter decremented successfully',
    type: CounterResponse,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Counter not found',
  })
  async decrementCounter(
    @Param('id') id: string,
    @Body() body: UpdateCounterModel,
  ): Promise<CounterResponse> {
    const counter = await lastValueFrom(
      this.counterService.decrementCounter({ id, value: body.value }),
    );
    return new CounterResponse(counter);
  }

  @Patch(':id/reset')
  @ApiOperation({ summary: "Resets the counter's value to zero" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Counter reset successfully',
    type: CounterResponse,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Counter not found',
  })
  async resetCounter(@Param('id') id: string): Promise<CounterResponse> {
    const counter = await lastValueFrom(
      this.counterService.resetCounter({ id }),
    );
    return new CounterResponse(counter);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Retrieves the counter by its unique ID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Counter retrieved successfully',
    type: CounterResponse,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Counter not found',
  })
  async getCounter(@Param('id') id: string): Promise<CounterResponse> {
    const counter = await lastValueFrom(this.counterService.getCounter({ id }));
    return new CounterResponse(counter);
  }
}
