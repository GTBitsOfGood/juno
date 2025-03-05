import {
  IsEmail,
  IsNotEmpty,
  ArrayNotEmpty,
  ValidateNested,
  IsOptional,
  IsInt,
  IsString,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import { EmailProto, IdentifierProto } from 'juno-proto';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SendGridDnsRecords, SendGridRecord } from 'juno-proto/dist/gen/email';

export class EmailDomain implements EmailProto.EmailDomain {
  domain: string;
  subdomain?: string | undefined;
  sendgridId: number;
  projects: IdentifierProto.ProjectIdentifier[];
}

export class EmailSender implements EmailProto.EmailSender {
  username: string;
  description?: string | undefined;
  domain: string;
  projects: IdentifierProto.ProjectIdentifier[];
}

export class EmailConfigResponse {
  @ApiProperty({
    type: 'number',
    description: 'Email Configuration ID',
  })
  @IsNotEmpty()
  @IsInt()
  id: number;

  @ApiProperty({
    type: 'string',
    description: 'The configured environment',
  })
  @IsNotEmpty()
  @IsString()
  environment: string;

  @ApiProperty({
    type: 'string',
    description: 'The configured sendGrid key',
  })
  @IsNotEmpty()
  @IsString()
  sendgridKey: string;

  @ApiProperty({
    type: [EmailDomain],
    description: 'The list of domains associated with the email config',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EmailDomain)
  domains: EmailDomain[];

  @ApiProperty({
    type: [EmailSender],
    description: 'The list of senders associated with the email config',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EmailSender)
  senders: EmailSender[];

  constructor(emailConfig: EmailProto.EmailServiceConfig) {
    this.id = emailConfig.id;
    this.environment = emailConfig.environment;
    this.sendgridKey = emailConfig.sendgridKey;
    this.domains = emailConfig.domains;
    this.senders = emailConfig.senders;
  }
}

export class RegisterEmailModel {
  @ApiProperty({
    type: 'string',
    format: 'email',
    description: 'The email to register',
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({
    type: 'string',
    description: 'The name to assosicate with the email',
  })
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    type: 'string',
    format: 'email',
    description: 'The email to reply-to',
  })
  @IsOptional()
  @IsEmail()
  replyTo?: string;

  @ApiProperty({
    type: 'string',
    description:
      'The nickname to assosicate with the sender (only visible in sendgrid)',
  })
  @IsOptional()
  nickname: string;

  @ApiProperty({
    type: 'string',
    example: '123 Main St.',
    description: 'The address to assosicate with the sender',
  })
  @IsNotEmpty()
  address: string;

  @ApiProperty({
    type: 'string',
    example: 'Atlanta',
    description: 'The city to assosicate with the sender',
  })
  @IsNotEmpty()
  city: string;

  @ApiProperty({
    type: 'string',
    example: 'GA',
    description: 'The state to assosicate with the sender',
  })
  @IsNotEmpty()
  state: string;

  @ApiProperty({
    type: 'string',
    example: '30332',
    description: 'The zip code to assosicate with the sender',
  })
  @IsNotEmpty()
  zip: string;

  @ApiProperty({
    type: 'string',
    example: 'USA',
    description: 'The country to assosicate with the sender',
  })
  @IsNotEmpty()
  country: string;
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

export class SetupEmailResponse {
  @ApiProperty({
    type: 'boolean',
    description: 'Whether an email was successfully setup',
  })
  success: boolean;

  constructor(res: EmailProto.SetupResponse) {
    this.success = res.success;
  }
}

export class SetupEmailServiceModel {
  @ApiProperty({
    type: 'string',
    description: 'The sendgrid API Key to use',
  })
  @IsNotEmpty()
  sendgridKey: string;
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

class EmailSenderSendEmailModel {
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
  subdomain?: string | undefined;
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
  @ValidateNested({ each: true })
  @IsOptional()
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

  @ApiProperty({
    type: [EmailRecipient],
    description: 'List of emails to add to the Reply To list of the email',
  })
  @ValidateNested({ each: true })
  @IsOptional()
  @Type(() => EmailRecipient)
  replyToList: EmailRecipient[] = [];

  @ApiProperty({
    type: EmailSenderSendEmailModel,
    description: 'The sender of the email',
  })
  @ValidateNested({ each: true })
  @Type(() => EmailSenderSendEmailModel)
  sender: EmailSenderSendEmailModel | undefined;

  @ApiProperty({
    type: 'string',
    example: 'Email subject',
    description: 'The subject of the email',
  })
  @IsNotEmpty()
  subject: string;

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
    this.id = Number(res.id);
    this.valid = `${res.valid}`;
    this.records = new SendGridDNSResponse(res.records);
    this.statusCode = res.statusCode;
  }
}
