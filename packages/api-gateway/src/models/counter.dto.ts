import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { CounterProto } from 'juno-proto';

export class CounterResponse {
  @ApiProperty({ description: 'The ID of the counter' })
  id: string;

  @Transform(({ value }) => Number(value))
  @ApiProperty({ description: 'The value of the counter' })
  value: number;

  constructor(counter: CounterProto.Counter) {
    this.id = counter.id;
    this.value = counter.value;
  }
}