import { Body, Controller, Post, OnModuleInit } from '@nestjs/common';
import { RegisterEmailModel, RegisterEmailResponse } from 'src/models/email';

@Controller('email')
export class EmailController implements OnModuleInit {
  onModuleInit() {}

  @Post('register')
  async registerSenderAddress(@Body('') params: RegisterEmailModel) {
    // const registeredEmail = this.emailService.registerSenderAddress(params);

    return new RegisterEmailResponse(params.email);
  }
}
