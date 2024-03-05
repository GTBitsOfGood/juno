import { Injectable, OnModuleInit } from '@nestjs/common';
import { MailService as SendGridMailService } from '@sendgrid/mail';

@Injectable()
export class SendGridService
  extends SendGridMailService
  implements OnModuleInit
{
  async onModuleInit() {
    if (process.env.SENDGRID_API_KEY) {
      this.setApiKey(process.env.SENDGRID_API_KEY);
    }
  }
}
