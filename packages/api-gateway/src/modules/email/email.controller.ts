import {
  Body,
  Controller,
  Post,
  OnModuleInit,
  HttpException,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { EmailProto } from 'juno-proto';
import { EMAIL_SERVICE_NAME } from 'juno-proto/dist/gen/email';
import { lastValueFrom } from 'rxjs';
import { RegisterEmailModel, RegisterEmailResponse } from 'src/models/email';

@Controller('email')
export class EmailController implements OnModuleInit {
  private emailService: EmailProto.EmailServiceClient;
  constructor(@Inject(EMAIL_SERVICE_NAME) private emailClient: ClientGrpc) {}

  @Post('register')
  async registerSenderAddress(@Body('') params: RegisterEmailModel) {
    return new RegisterEmailResponse(params.email);
  }

  onModuleInit() {
    this.emailService =
      this.emailClient.getService<EmailProto.EmailServiceClient>(
        EMAIL_SERVICE_NAME,
      );
  }

  @Post('/register-domain')
  async registerEmailDomain(
    @Body('domain') domain: string,
    @Body('subdomain') subdomain: string,
  ): Promise<EmailProto.AuthenticateDomainResponse> {
    if (!domain) {
      throw new HttpException(
        'Cannot register domain (no domain supplied)',
        HttpStatus.BAD_REQUEST,
      );
    }

    const res = this.emailService.authenticateDomain({
      domain,
      subdomain,
    });

    console.log(res);
    return lastValueFrom(res);
  }

  @Post('/send')
  async sendEmail(
    @Body('destination') destination: string,
    @Body('subject') subject: string,
    @Body('body') body: string,
  ): Promise<EmailProto.SendEmailResponse> {
    if (!body || !destination || !subject) {
      throw new HttpException(
        'Missing Email Parameters',
        HttpStatus.BAD_REQUEST,
      );
    }

    // const emailResponse = await lastValueFrom(
    //   this.emailService.sendEmail({
    //     destination,
    //     subject,
    //     body,
    //   }),
    // );

    return { success: true };
  }
}
