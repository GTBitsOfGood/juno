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

import {
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
  ApiTags,
  ApiCreatedResponse,
  ApiOperation,
} from '@nestjs/swagger';

const { EMAIL_SERVICE_NAME } = EmailProto;

@ApiBearerAuth()
@ApiTags('email')
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

  @ApiOperation({
    description: 'This endpoint registers a user',
  })
  @ApiCreatedResponse({
    description: 'Email registered successfully',
    type: RegisterEmailResponse,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiBadRequestResponse({ description: 'Bad Request' })
  @Post('register')
  async registerSenderAddress(@Body('') params: RegisterEmailModel) {
    return new RegisterEmailResponse(params.email);
  }

  @ApiOperation({
    description: 'This endpoint sends an email',
  })
  @ApiCreatedResponse({
    description: 'Email sent successfully',
    type: SendEmailResponse,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiBadRequestResponse({ description: 'Bad Request' })
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
