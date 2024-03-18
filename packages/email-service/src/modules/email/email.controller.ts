import { Body, Controller } from '@nestjs/common';
import { EmailService } from './email.service';
import { EmailProto } from 'juno-proto';

@Controller()
export class EmailController {
  constructor(private emailService: EmailService) {}
  async registerSender(
    @Body() req: EmailProto.RegisterSenderRequest,
  ): Promise<EmailProto.RegisterSenderResponse> {
    return await this.emailService.registerSender(req);
  }
}
