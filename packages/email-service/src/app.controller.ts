import { Post, Body, Controller } from '@nestjs/common';
import { AppService } from './app.service';
import { EmailProto } from 'juno-proto';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}
  @Post('/register-sender')
  async registerSender(
    @Body() req: EmailProto.RegisterSenderRequest,
  ): Promise<EmailProto.RegisterSenderResponse> {
    return await this.appService.registerSender(req);
  }
}
