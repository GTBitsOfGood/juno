import { IsEmail, IsNotEmpty } from 'class-validator';
import { EmailProto } from 'juno-proto';

export class RegisterEmailModel {
  @IsNotEmpty()
  @IsEmail()
  address: string;
}

export class RegisterEmailResponse {
  address: string;

  constructor(email: EmailProto.Email) {
    this.address = email.address;
  }
}