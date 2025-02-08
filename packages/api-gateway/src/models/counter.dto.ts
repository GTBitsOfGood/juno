import { Transform } from 'class-transformer';
import { CounterProto } from 'juno-proto';

export class CounterResponse {
  id: string;

  @Transform(({ value }) => Number(value))
  value: number;

  constructor(counter: CounterProto.Counter) {
    this.id = counter.id;
    this.value = counter.value;
  }
}