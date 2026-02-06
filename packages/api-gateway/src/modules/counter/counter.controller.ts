import {
  Controller,
  Delete,
  Get,
  HttpStatus,
  Inject,
  OnModuleInit,
  Param,
  Patch,
} from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { CounterResponse } from 'src/models/counter.dto';
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

  @Get(':id')
  @ApiOperation({ summary: "Retrieves a counter's value." })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returned the value for the counter with the given ID',
    type: CounterResponse,
  })
  async getCounter(@Param('id') idStr: string): Promise<CounterResponse> {
    const id = decodeURI(idStr);

    const counter = this.counterService.getCounter({
      id,
    });

    return new CounterResponse(await lastValueFrom(counter));
  }

  // this operation is not idempotent, so PATCH was chosen
  @Patch(':id/increment')
  @ApiOperation({ summary: 'Increment the value of a counter.' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returned the updated counter value.',
    type: CounterResponse,
  })
  async incrementCounter(@Param('id') idStr: string): Promise<CounterResponse> {
    const id = decodeURI(idStr);
    const counter = this.counterService.incrementCounter({ id });
    return new CounterResponse(await lastValueFrom(counter));
  }

  @Patch(':id/decrement')
  @ApiOperation({ summary: 'Decrement the value of a counter. ' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returned the updated counter value.',
    type: CounterResponse,
  })
  async decrementCounter(@Param('id') idStr: string): Promise<CounterResponse> {
    const id = decodeURI(idStr);
    const counter = this.counterService.decrementCounter({ id });
    return new CounterResponse(await lastValueFrom(counter));
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Reset the value of a counter. ' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returned the updated counter value.',
    type: CounterResponse,
  })
  async resetCounter(@Param('id') idStr: string): Promise<CounterResponse> {
    const id = decodeURI(idStr);
    const counter = this.counterService.resetCounter({ id });
    return new CounterResponse(await lastValueFrom(counter));
  }
}
