// import {
//   Controller,
//   Inject,
//   OnModuleInit,
//   Get,
//   Param,
//   Post,
// } from '@nestjs/common';
// import { ClientGrpc } from '@nestjs/microservices';
// import { CounterProto } from 'juno-proto';
// import { lastValueFrom } from 'rxjs';
// import { CounterResponse } from 'src/models/counter.dto';

// const { COUNTER_SERVICE_NAME } = CounterProto;

// @Controller('counter')
// export class CounterController implements OnModuleInit {
//   private counterService: CounterProto.CounterServiceClient;

//   constructor(
//     @Inject(COUNTER_SERVICE_NAME) private serviceClient: ClientGrpc,
//   ) {}

//   onModuleInit() {
//     this.counterService =
//       this.serviceClient.getService<CounterProto.CounterServiceClient>(
//         COUNTER_SERVICE_NAME,
//       );
//   }

//   @Get(':id')
//   async getCounterById(@Param('id') id: string): Promise<CounterResponse> {
//     const counter = await lastValueFrom(
//       this.counterService.getCounter({ counterId: id }),
//     );
//     return new CounterResponse(counter);
//   }

//   @Post('reset/:id')
//   async resetCounter(@Param('id') id: string): Promise<CounterResponse> {
//     const counter = await lastValueFrom(
//       this.counterService.resetCounter({ counterId: id }),
//     );
//     return new CounterResponse(counter);
//   }

//   @Post('increment/:id')
//   async incrementCounter(@Param('id') id: string): Promise<CounterResponse> {
//     const counter = await lastValueFrom(
//       this.counterService.incrementCounter({ counterId: id }),
//     );
//     return new CounterResponse(counter);
//   }

//   @Post('decrement/:id')
//   async decrementCounter(@Param('id') id: string): Promise<CounterResponse> {
//     const counter = await lastValueFrom(
//       this.counterService.decrementCounter({ counterId: id }),
//     );
//     return new CounterResponse(counter);
//   }
// }

import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Inject,
  InternalServerErrorException,
} from '@nestjs/common';
import { ClientGrpc, Client } from '@nestjs/microservices';
import { CounterProto } from 'juno-proto';
import { Observable } from 'rxjs';

@Controller('counter')
export class CounterController {
  private counterService: CounterProto.CounterServiceClient;

  constructor(
    @Inject(CounterProto.COUNTER_SERVICE_NAME) private client: ClientGrpc,
  ) {}

  // private readonly client: ClientGrpc;

  onModuleInit() {
    this.counterService =
      this.client.getService<CounterProto.CounterServiceClient>(
        CounterProto.COUNTER_SERVICE_NAME,
      );
  }

  @Post('increment/:counterId')
  incrementCounter(
    @Param('counterId') counterId: string,
  ): Observable<CounterProto.IncrementCounterResponse> {
    return this.counterService.incrementCounter({ counterId });
  }

  @Post('decrement/:counterId')
  decrementCounter(
    @Param('counterId') counterId: string,
  ): Observable<CounterProto.DecrementCounterResponse> {
    return this.counterService.decrementCounter({ counterId });
  }

  @Post('reset/:counterId')
  resetCounter(
    @Param('counterId') counterId: string,
  ): Observable<CounterProto.ResetCounterResponse> {
    return this.counterService.resetCounter({ counterId });
  }

  @Get(':counterId')
  getCounter(
    @Param('counterId') counterId: string,
  ): Observable<CounterProto.GetCounterResponse> {
    // return this.counterService.getCounter({ counterId });
    try {
      console.log(`Attempting to get counter now: ${counterId}`);
      const response = this.counterService.getCounter({ counterId });
      return response;
    } catch (error) {
      // Log the error for debugging
      console.error('Error in getCounter:', error);
      // Throw a NestJS exception that will be caught by the global exception filter
      throw new InternalServerErrorException('Failed to get counter');
    }
  }
}
