import { IsNotEmpty, IsEmail } from 'class-validator';

export class AuthenticateUserBody {
  @IsEmail()
  @IsNotEmpty()
  email: string;
  @IsNotEmpty()
  password: string;
}
