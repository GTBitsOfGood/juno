import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';
import { CounterProto } from 'juno-proto';

export class CounterChangeModel {
  @ApiProperty({
    type: 'string',
    description: 'ID of the counter',
  })
  @IsNotEmpty()
  counterId: string;

  @ApiProperty({
    type: 'number',
    description: 'Amount to change the counter by',
  })
  @IsNotEmpty()
  amount: number;
}

export class CounterResponse {
  @ApiProperty({ description: 'ID of the counter' })
  counterId: string;

  @ApiProperty({ description: 'The current value of the counter' })
  value: number;

  constructor(counter: CounterProto.CounterResponse) {
    this.counterId = counter.counterId;
    this.value = counter.value;
  }
}
