import { IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class CounterResponse {
  @IsString()
  id: string;
  @Transform(({ value }) => Number(value))
  value: number;

  constructor(config: { id: string; value: number }) {
    this.id = config.id;
    this.value = config.value;
  }
}
