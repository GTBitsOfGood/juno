import {
  IsEmail,
  IsNotEmpty,
  ArrayNotEmpty,
  ValidateNested,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';
import { EmailProto } from 'juno-proto';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SendGridDnsRecords, SendGridRecord } from 'juno-proto/dist/gen/email';

export class RegisterEmailModel {
  @ApiProperty({
    type: 'string',
    format: 'email',
    description: 'The email to register',
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;
}

export class RegisterEmailResponse {
  @ApiProperty({
    type: 'string',
    format: 'email',
    description: 'The email registered',
  })
  email: string;

  constructor(email: string) {
    this.email = email;
  }
}

class EmailRecipient {
  @ApiProperty({
    type: 'string',
    format: 'email',
    description: 'Recipient email address',
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiPropertyOptional({
    type: 'string',
    example: 'John Doe',
    description: 'Recipient name',
  })
  name?: string | undefined;
}

class EmailSender {
  @ApiProperty({
    type: 'string',
    format: 'email',
    description: 'Sender email address',
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiPropertyOptional({
    type: 'string',
    example: 'John Doe',
    description: 'Sender name',
  })
  name?: string | undefined;
}

class EmailContent {
  @ApiProperty({
    type: 'string',
    example: 'text/html',
    description: 'MIME type for the content',
  })
  @IsNotEmpty()
  type: string;

  @ApiProperty({
    type: 'string',
    example: 'Email content',
    description: 'Content of the email',
  })
  @IsNotEmpty()
  value: string;
}

export class RegisterDomainModel {
  @ApiProperty({
    type: 'string',
    example: 'example.com',
    description: 'Domain to be registered',
  })
  @IsNotEmpty()
  domain: string;

  @ApiProperty({
    type: 'string',
    example: 'subdomain',
    description: 'Subdomain to be registered',
  })
  @IsNotEmpty()
  subdomain: string;
}

export class VerifyDomainModel {
  @ApiProperty({
    type: 'string',
    example: 'example.com',
    description: 'Domain to be verified',
  })
  @IsNotEmpty()
  domain: string;
}

export class SendEmailModel {
  @ApiProperty({
    type: [EmailRecipient],
    description: 'List of recipients for the email',
  })
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => EmailRecipient)
  recipients: EmailRecipient[];

  @ApiProperty({
    type: [EmailRecipient],
    description: 'List of email addresses to CC on the email',
  })
  @ValidateNested({ each: true })
  @IsOptional()
  @Type(() => EmailRecipient)
  cc: EmailRecipient[] = [];

  @ApiProperty({
    type: [EmailRecipient],
    description: 'List of email addresses to BCC on the email',
  })
  @ValidateNested({ each: true })
  @IsOptional()
  @Type(() => EmailRecipient)
  bcc: EmailRecipient[] = [];

  @ApiProperty({ type: EmailSender, description: 'The sender of the email' })
  @ValidateNested({ each: true })
  @Type(() => EmailSender)
  sender: EmailSender | undefined;

  @ApiProperty({
    type: [EmailContent],
    description: 'List of MIME content to send in the email',
  })
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => EmailContent)
  content: EmailContent[];
}

export class SendEmailResponse {
  @ApiProperty({
    type: 'boolean',
    description: 'Whether an email was successfully sent',
  })
  success: boolean;

  constructor(res: EmailProto.SendEmailResponse) {
    this.success = res.statusCode == 200;
  }
}

export class SendGridDNSRecord {
  valid: boolean;
  type: string;
  host: string;
  data: string;

  constructor(res: SendGridRecord) {
    this.valid = res.valid;
    this.type = res.type;
    this.host = res.host;
    this.data = res.data;
  }
}

export class SendGridDNSResponse {
  @Type(() => SendGridDNSRecord)
  mail_cname: SendGridDNSRecord;
  @Type(() => SendGridDNSRecord)
  dkim1: SendGridDNSRecord;
  @Type(() => SendGridDNSRecord)
  dkim2: SendGridDNSRecord;

  constructor(res: SendGridDnsRecords) {
    this.mail_cname = new SendGridDNSRecord(res.mailCname);
    this.dkim1 = new SendGridDNSRecord(res.dkim1);
    this.dkim2 = new SendGridDNSRecord(res.dkim2);
  }
}

export class RegisterDomainResponse {
  @ApiProperty({ type: 'number' })
  id: number;
  @ApiProperty({ type: 'string' })
  valid: string;
  @ApiProperty({ type: SendGridDNSResponse })
  @Type(() => SendGridDNSResponse)
  records: SendGridDNSResponse;
  @ApiProperty({ type: 'number' })
  statusCode: number;

  constructor(
    res:
      | EmailProto.AuthenticateDomainResponse
      | EmailProto.VerifyDomainResponse,
  ) {
    this.id = res.id;
    this.valid = `${res.valid}`;
    this.records = new SendGridDNSResponse(res.records);
    this.statusCode = res.statusCode;
  }
}
