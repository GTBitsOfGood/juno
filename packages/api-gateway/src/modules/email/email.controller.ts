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
  RegisterDomainModel,
  RegisterDomainResponse,
  RegisterEmailModel,
  RegisterEmailResponse,
  SendEmailModel,
  SendEmailResponse,
  VerifyDomainModel,
} from 'src/models/email.dto';
import { EmailProto } from 'juno-proto';
import { validateOrReject } from 'class-validator';

import {
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
  ApiTags,
  ApiCreatedResponse,
  ApiOperation,
  ApiNotFoundResponse,
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
    summary: 'Registers a sender email address.',
  })
  @ApiCreatedResponse({
    description: 'Email registered successfully',
    type: RegisterEmailResponse,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiBadRequestResponse({ description: 'Bad Request' })
  @Post('/register-sender')
  async registerSenderAddress(@Body('') params: RegisterEmailModel) {
    return new RegisterEmailResponse(params.email);
  }

  @ApiOperation({
    summary: 'Registers a sender domain.',
  })
  @ApiCreatedResponse({
    description: 'Domain registered successfully',
    type: RegisterDomainResponse,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiBadRequestResponse({ description: 'Bad request' })
  @Post('/register-domain')
  async registerEmailDomain(
    @Body() req: RegisterDomainModel,
  ): Promise<RegisterDomainResponse> {
    if (!req.domain) {
      throw new HttpException(
        'Cannot register domain (no domain supplied)',
        HttpStatus.BAD_REQUEST,
      );
    }

    const res = this.emailService.authenticateDomain({
      domain: req.domain,
      subdomain: req.subdomain,
    });

    return new RegisterDomainResponse(await lastValueFrom(res));
  }

  @ApiOperation({
    summary: 'Verifies a sender domain registration status.',
  })
  @ApiCreatedResponse({
    description: 'Domain is registered',
    type: RegisterDomainResponse,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiNotFoundResponse({ description: 'No domain registered' })
  @Post('/verify-domain')
  async verifySenderDomain(
    @Body() req: VerifyDomainModel,
  ): Promise<RegisterDomainResponse> {
    if (!req.domain || req.domain.length == 0) {
      throw new HttpException(
        'Cannot register domain (no domain supplied)',
        HttpStatus.BAD_REQUEST,
      );
    }

    const res = this.emailService.verifyDomain({
      domain: req.domain,
    });

    return new RegisterDomainResponse(await lastValueFrom(res));
  }

  @ApiOperation({
    summary: 'Sends an email using Juno services.',
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
        'Missing email parameters',
        HttpStatus.BAD_REQUEST,
      );
    }
    try {
      await validateOrReject(req);
    } catch {
      throw new HttpException(
        'Invalid email parameters',
        HttpStatus.BAD_REQUEST,
      );
    }
    return new SendEmailResponse(
      await lastValueFrom(
        this.emailService.sendEmail({
          recipients: req.recipients,
          sender: {
            email: req.sender.email,
            name: req.sender.name,
          },
          content: req.content,
        }),
      ),
    );
  }
}
