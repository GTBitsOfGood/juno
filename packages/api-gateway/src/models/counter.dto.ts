import { IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CounterResponse {
  @IsString()
  @ApiProperty({ description: 'The ID of the counter' })
  id: string;
  @Transform(({ value }) => Number(value))
  @ApiProperty({ description: 'The current value of the counter' })
  value: number;

  constructor(config: { id: string; value: number }) {
    this.id = config.id;
    this.value = config.value;
  }
}
