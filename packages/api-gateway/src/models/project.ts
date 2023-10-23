import { IsNotEmpty } from 'class-validator';

export class CreateProjectModel {
  @IsNotEmpty()
  name: string;
}
