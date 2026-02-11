import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive } from 'class-validator';
import { CounterProto } from 'juno-proto';

export class UpdateCounterModel {
  @IsInt()
  @IsPositive()
  @ApiProperty({ description: 'The value to update by' })
  value: number;
}

export class CounterResponse {
  @ApiProperty({ description: 'The ID of the counter' })
  id: string;

  @ApiProperty({ description: 'The value of the counter' })
  value: number;

  constructor(counter: CounterProto.Counter) {
    this.id = counter.id;
    this.value = counter.value;
  }
}
