import { Injectable } from '@nestjs/common';
import { MailService as SendGridMailService } from '@sendgrid/mail';

@Injectable()
export class SendGridService extends SendGridMailService {}
