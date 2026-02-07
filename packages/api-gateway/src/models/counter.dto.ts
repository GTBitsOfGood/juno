import { ApiProperty } from '@nestjs/swagger';
import { CounterProto } from 'juno-proto';

export class CounterResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  value: number;

  constructor(counter: CounterProto.Counter) {
    this.id = counter.id;
    this.value = counter.value;
  }
}
