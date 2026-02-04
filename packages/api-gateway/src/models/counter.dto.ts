import { IsString, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class CounterResponse {
  @IsString()
  id: string;
  @Transform(({ value }) => Number(value))
  value: number;

  constructor(config: any) {
    this.id = config.id;
    this.value = config.value;
  }
}
