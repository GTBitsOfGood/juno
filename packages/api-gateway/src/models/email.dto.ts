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

export enum AggregationInterval {
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
}

export class SendEmailStatistics {
  @ApiProperty({
    description: 'The number of results to return.',
  })
  limit?: number;
  @ApiProperty({
    description: 'The point in the list to begin retrieving results.',
  })
  offset?: number;
  @ApiProperty({
    description:
      "How to group the statistics. Must be either 'day', 'week', or 'month'.",
    enum: AggregationInterval,
    enumName: 'AggregationInterval',
  })
  aggregated_by?: AggregationInterval; //This needs to be an enum
  @ApiProperty({
    description:
      'The starting date of the statistics to retrieve. Must follow format YYYY-MM-DD.',
    example: '2025-01-01',
  })
  start_date: string;
  @ApiProperty({
    description:
      'The end date of the statistics to retrieve. Defaults to today. Must follow format YYYY-MM-DD.',
  })
  end_date?: string;
}

export class SendEmailStatisticsResponse {
  @ApiProperty({ description: 'Date', example: '2023-12-24' })
  date: string;

  @ApiProperty({
    description: 'The number of links that were clicked in your emails.',
  })
  clicks: number;

  @ApiProperty({
    description:
      'The number of unique recipients who clicked links in your emails.',
  })
  unique_clicks: number;

  @ApiProperty({
    description:
      'The total number of times your emails were opened by recipients.',
  })
  opens: number;

  @ApiProperty({
    description: 'The number of unique recipients who opened your emails.',
  })
  unique_opens: number;

  @ApiProperty({
    description:
      'The number of emails that were not allowed to be delivered by ISPs.',
  })
  blocks: number;

  @ApiProperty({
    description: 'The number of emails that were dropped because of a bounce.',
  })
  bounce_drops: number;

  @ApiProperty({
    description:
      'The number of emails that bounced instead of being delivered.',
  })
  bounces: number;

  @ApiProperty({
    description:
      'The number of emails that temporarily could not be delivered.',
  })
  deferred: number;

  @ApiProperty({
    description: 'The number of emails confirmed to have been delivered.',
  })
  delivered: number;

  @ApiProperty({
    description:
      'The number of recipients with malformed or invalid email addresses.',
  })
  invalid_emails: number;

  @ApiProperty({
    description:
      'Requests from your website, application, or mail client via SMTP Relay or API.',
  })
  processed: number;

  @ApiProperty({
    description: 'The number of emails that were requested to be delivered.',
  })
  requests: number;

  @ApiProperty({
    description:
      'The number of emails dropped due to a recipient marking your email as spam.',
  })
  spam_report_drops: number;

  @ApiProperty({
    description: 'The number of recipients who marked your email as spam.',
  })
  spam_reports: number;

  @ApiProperty({
    description:
      'The number of emails dropped due to a recipient unsubscribing.',
  })
  unsubscribe_drops: number;

  @ApiProperty({
    description: 'The number of recipients who unsubscribed from your emails.',
  })
  unsubscribes: number;

  constructor(statisticResponse: EmailProto.StatisticResponse) {
    this.date = statisticResponse.date;
    this.clicks = statisticResponse.clicks;
    this.unique_clicks = statisticResponse.uniqueClicks;
    this.opens = statisticResponse.opens;
    this.unique_opens = statisticResponse.uniqueOpens;
    this.blocks = statisticResponse.blocks;
    this.bounce_drops = statisticResponse.bounceDrops;
    this.bounces = statisticResponse.bounces;
    this.deferred = statisticResponse.deferred;
    this.delivered = statisticResponse.delivered;
    this.invalid_emails = statisticResponse.invalidEmails;
    this.processed = statisticResponse.processed;
    this.requests = statisticResponse.requests;
    this.spam_report_drops = statisticResponse.spamReportDrops;
    this.spam_reports = statisticResponse.spamReports;
    this.unsubscribe_drops = statisticResponse.unsubscribeDrops;
    this.unsubscribes = statisticResponse.unsubscribes;
  }
}

export class SendEmailStatisticsResponses {
  @ApiProperty({
    description: 'List of email analytics.',
    type: [SendEmailStatisticsResponse],
  })
  responses: SendEmailStatisticsResponse[];
  constructor(statisticsResponses: EmailProto.StatisticResponses) {
    this.responses =
      statisticsResponses?.responses?.map(
        (response) => new SendEmailStatisticsResponse(response),
      ) || [];
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
