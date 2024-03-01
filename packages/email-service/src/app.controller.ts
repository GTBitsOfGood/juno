import { Body, Controller, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { EmailProto } from 'juno-proto';

@Controller()
@EmailProto.SendGridEmailServiceControllerMethods()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Post('/register-domain')
  async authenticateDomain(
    @Body() req: EmailProto.AuthenticateDomainRequest,
  ): Promise<EmailProto.AuthenticateDomainResponse> {
    return await this.appService.authenticateDomain(req);
  }
}
