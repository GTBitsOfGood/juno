import {
  IsEmail,
  IsNotEmpty,
  ArrayNotEmpty,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { EmailProto } from 'juno-proto';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterEmailModel {
  @ApiProperty({ type: 'string', format: 'email' })
  @IsNotEmpty()
  @IsEmail()
  email: string;
}

export class RegisterEmailResponse {
  @ApiProperty({ type: 'string', format: 'email' })
  email: string;

  constructor(email: string) {
    this.email = email;
  }
}

class EmailRecipient {
  @ApiProperty({ type: 'string', format: 'email' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ type: 'string', example: 'John Doe' })
  name?: string | undefined;
}

class EmailSender {
  @ApiProperty({ type: 'string', format: 'email' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ type: 'string', example: 'John Doe' })
  name?: string | undefined;
}

class EmailContent {
  @ApiProperty({ type: 'string', example: 'text/html' })
  @IsNotEmpty()
  type: string;

  @ApiProperty({ type: 'string', example: 'Email content' })
  @IsNotEmpty()
  value: string;
}

export class SendEmailModel {
  @ApiProperty({ type: [EmailRecipient] })
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => EmailRecipient)
  recipients: EmailRecipient[];

  @ApiProperty({ type: EmailSender })
  @ValidateNested({ each: true })
  @Type(() => EmailSender)
  sender: EmailSender | undefined;

  @ApiProperty({ type: [EmailContent] })
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => EmailContent)
  content: EmailContent[];
}

export class SendEmailResponse {
  @ApiProperty({ type: 'boolean' })
  success: boolean;

  constructor(res: EmailProto.SendEmailResponse) {
    this.success = res.statusCode == 200;
  }
}
