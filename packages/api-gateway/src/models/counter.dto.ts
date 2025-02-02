import { Transform } from 'class-transformer';

import { CounterProto } from 'juno-proto';

export class CounterResponse {
  @Transform(({ value }) => Number(value))
  value: number;

  constructor(counter) {
    this.value = counter.value;
  }
}
