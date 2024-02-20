import {
  Body,
  Controller,
  Post,
  OnModuleInit,
  Inject,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { RegisterEmailModel, RegisterEmailResponse } from 'src/models/email';
import { ClientGrpc } from '@nestjs/microservices';
import { EmailProto, JwtProto } from 'juno-proto';
import { SendEmailRequestResponse } from 'juno-proto/dist/gen/email';

const { EMAIL_SERVICE_NAME } = EmailProto;

@Controller('email')
export class EmailController implements OnModuleInit {
  private emailService: EmailProto.EmailServiceClient;

  constructor(@Inject(EMAIL_SERVICE_NAME) private emailClient: ClientGrpc) {}

  @Post('register')
  async registerSenderAddress(@Body('') params: RegisterEmailModel) {
    return new RegisterEmailResponse(params.email);
  }

  onModuleInit() {
    // this.emailService =
    //   this.emailClient.getService<EmailProto.EmailServiceClient>(
    //     EMAIL_SERVICE_NAME,
    //   );
  }

  @Post('/send')
  async sendEmail(
    @Body('destination') destination: string,
    @Body('subject') subject: string,
    @Body('body') body: string,
  ): Promise<SendEmailRequestResponse> {
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
