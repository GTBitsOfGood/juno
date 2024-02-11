import { IsNotEmpty } from 'class-validator';

export class AuthenticateUserBody {
  @IsNotEmpty()
  email: string;
  @IsNotEmpty()
  password: string;
}
