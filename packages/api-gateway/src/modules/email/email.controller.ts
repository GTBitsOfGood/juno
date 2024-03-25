import {
  Body,
  Controller,
  Post,
  OnModuleInit,
  Inject,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import {
  RegisterEmailModel,
  RegisterEmailResponse,
  SendEmailModel,
  SendEmailResponse,
} from 'src/models/email';
import { EmailProto } from 'juno-proto';
import { plainToInstance } from 'class-transformer';
import { validateOrReject } from 'class-validator';

const { EMAIL_SERVICE_NAME } = EmailProto;

@Controller('email')
export class EmailController implements OnModuleInit {
  private emailService: EmailProto.EmailServiceClient;

  constructor(@Inject(EMAIL_SERVICE_NAME) private emailClient: ClientGrpc) {}

  onModuleInit() {
    this.emailService =
      this.emailClient.getService<EmailProto.EmailServiceClient>(
        EMAIL_SERVICE_NAME,
      );
  }

  @Post('register')
  async registerSenderAddress(@Body('') params: RegisterEmailModel) {
    return new RegisterEmailResponse(params.email);
  }

  @Post('/send')
  async sendEmail(@Body() req: SendEmailModel): Promise<SendEmailResponse> {
    if (!req) {
      throw new HttpException(
        'Missing Email Parameters',
        HttpStatus.BAD_REQUEST,
      );
    }
    const params = plainToInstance(SendEmailModel, req);
    try {
      await validateOrReject(params);
    } catch {
      throw new HttpException(
        'Invalid email parameters',
        HttpStatus.BAD_REQUEST,
      );
    }
    return new SendEmailResponse(
      await lastValueFrom(
        this.emailService.sendEmail({
          recipients: params.recipients,
          sender: params.sender,
          content: params.content,
        }),
      ),
    );
  }
}
