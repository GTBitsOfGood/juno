import { IsEmail, IsNotEmpty } from 'class-validator';

export class RegisterEmailModel {
  @IsNotEmpty()
  @IsEmail()
  email: string;
}

export class RegisterEmailResponse {
  email: string;

  constructor(email: string) {
    this.email = email;
  }
}
