import { Body, Controller, Post, OnModuleInit } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';
import { RegisterEmailModel, RegisterEmailResponse } from 'src/models/email';

@Controller('email')
export class EmailController implements OnModuleInit {
  // constructor(@Inject(EMAIL_SERVICE_NAME) private emailClient: ClientGrpc) {}

  onModuleInit() {
    // this.emailService =
    // this.emailClient.getService<EmailProto.EmailServiceClient>(
    //   EMAIL_SERVICE_NAME,
    // );
  }

  @Post('register')
  async registerSenderAddress(@Body('') params: RegisterEmailModel) {
    // const registeredEmail = this.emailService.registerSenderAddress(params);

    return new RegisterEmailResponse(params.email);
  }
}
