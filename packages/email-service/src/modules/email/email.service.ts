import { Injectable } from '@nestjs/common';
import { EmailProto } from 'juno-proto';
import { SendGridService } from 'src/sendgrid.service';

@Injectable()
export class EmailService {
  constructor(private sendgrid: SendGridService) {}

  async sendEmail(request: EmailProto.SendEmailRequest): Promise<void> {
    // SendGrid Client for future integration with API
    // Conditional statement used for testing without actually calling Sendgrid. Remove when perform actual integration
    if (process.env.SENDGRID_API_KEY) {
      await this.sendgrid.send({
        personalizations: [
          {
            to: request.recipients,
          },
        ],
        from: request.sender,
        content: [
          request.content[0],
          ...request.content.slice(1, request.content.length),
        ],
      });
    }
  }
}
