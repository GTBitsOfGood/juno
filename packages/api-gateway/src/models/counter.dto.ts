import { Transform } from 'class-transformer';

import { CounterProto } from 'juno-proto';

export class CounterResponse {
  value: number;

  constructor(counter) {
    this.value = counter.value;
  }
}
