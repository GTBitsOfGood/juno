import { status } from '@grpc/grpc-js';
import { Controller } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Prisma } from '@prisma/client';
import { CounterProto } from 'juno-proto';
import { CounterService } from './counter.service';
import { Observable } from 'rxjs';

@Controller()
@CounterProto.CounterServiceControllerMethods()
export class CounterDbController
  implements CounterProto.CounterServiceController
{
  constructor(private readonly counterService: CounterService) {}

  async incrementCounter(
    request: CounterProto.IncrementCounterRequest,
  ): Promise<CounterProto.IncrementCounterResponse> {
    throw new Error('Method not implemented.');
  }
  async decrementCounter(
    request: CounterProto.DecrementCounterRequest,
  ): Promise<CounterProto.DecrementCounterResponse> {
    throw new Error('Method not implemented.');
  }
  async resetCounter(
    request: CounterProto.ResetCounterRequest,
  ): Promise<CounterProto.ResetCounterResponse> {
    throw new Error('Method not implemented.');
  }
  async getCounter(
    request: CounterProto.GetCounterRequest,
  ): Promise<CounterProto.GetCounterResponse> {
    throw new Error('Method not implemented.');
  }
}
