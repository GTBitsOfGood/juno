import {
  IsEmail,
  IsNotEmpty,
  ArrayNotEmpty,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { EmailProto } from 'juno-proto';

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

class EmailRecipient {
  @IsNotEmpty()
  @IsEmail()
  email: string;
  name?: string | undefined;
}

class EmailSender {
  @IsNotEmpty()
  @IsEmail()
  email: string;
  name?: string | undefined;
}

class EmailContent {
  @IsNotEmpty()
  type: string;
  @IsNotEmpty()
  value: string;
}

export class SendEmailModel {
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => EmailRecipient)
  recipients: EmailRecipient[];
  @ValidateNested({ each: true })
  @Type(() => EmailSender)
  sender: EmailSender | undefined;
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => EmailContent)
  content: EmailContent[];
}

export class SendEmailResponse {
  success: boolean;

  constructor(res: EmailProto.SendEmailResponse) {
    this.success = res.success;
  }
}
