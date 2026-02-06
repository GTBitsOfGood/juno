import { IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class CounterResponse {
  @IsString()
  @ApiProperty({ description: 'The ID of the counter' })
  id: string;
  @Transform(({ value }) => Number(value))
  @ApiProperty({ description: 'The current value of the counter' })
  value: number;

  constructor(config: any) {
    this.id = config.id;
    this.value = config.value;
  }
}
