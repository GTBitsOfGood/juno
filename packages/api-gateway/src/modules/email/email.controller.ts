import {
  Body,
  Controller,
  Get,
  HttpException,
  BadRequestException,
  HttpStatus,
  Inject,
  OnModuleInit,
  Param,
  Post,
} from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { validateOrReject } from 'class-validator';
import { AuthCommonProto, EmailProto } from 'juno-proto';
import { lastValueFrom } from 'rxjs';
import {
  EmailConfigResponse,
  RegisterDomainModel,
  RegisterDomainResponse,
  RegisterEmailModel,
  RegisterEmailResponse,
  SendEmailModel,
  SendEmailResponse,
  SetupEmailResponse,
  SetupEmailServiceModel,
  VerifyDomainModel,
} from 'src/models/email.dto';

import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ApiKey } from 'src/decorators/api_key.decorator';

const { EMAIL_SERVICE_NAME, EMAIL_DB_SERVICE_NAME } = EmailProto;

@ApiBearerAuth('API_Key')
@ApiTags('email')
@Controller('email')
export class EmailController implements OnModuleInit {
  private emailService: EmailProto.EmailServiceClient;
  private emailDBService: EmailProto.EmailDbServiceClient;

  constructor(
    @Inject(EMAIL_SERVICE_NAME) private emailClient: ClientGrpc,
    @Inject(EMAIL_DB_SERVICE_NAME) private emailDBClient: ClientGrpc,
  ) {}

  onModuleInit() {
    this.emailService =
      this.emailClient.getService<EmailProto.EmailServiceClient>(
        EMAIL_SERVICE_NAME,
      );
    this.emailDBService =
      this.emailDBClient.getService<EmailProto.EmailDbServiceClient>(
        EMAIL_DB_SERVICE_NAME,
      );
  }

  @Get('config/:id')
  @ApiOperation({ summary: 'Get email configuration by ID' })
  @ApiBadRequestResponse({
    description: 'Parameters are invalid',
  })
  @ApiNotFoundResponse({
    description: 'No email config with specified ID was found',
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid API key provided',
  })
  @ApiOkResponse({
    description: 'Returned the email config associated with the specified ID',
    type: EmailConfigResponse,
  })
  async getEmailConfigById(
    @ApiKey() apiKey: AuthCommonProto.ApiKey,
    @Param('id') id: string,
  ): Promise<EmailConfigResponse> {
    const idNumber = parseInt(id);
    if (Number.isNaN(idNumber)) {
      throw new BadRequestException('Id must be a number');
    }

    const config = this.emailDBService.getEmailServiceConfig({
      id: idNumber,
      environment: apiKey.environment,
    });

    return new EmailConfigResponse(await lastValueFrom(config));
  }

  @ApiOperation({
    summary: 'Sets up an email service with the given Sendgrid API Key',
  })
  @ApiCreatedResponse({
    description: 'Email Service setup successfully',
    type: SetupEmailResponse,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiBadRequestResponse({ description: 'Bad Request' })
  @Post('/setup')
  async setup(
    @ApiKey() apiKey: AuthCommonProto.ApiKey,
    @Body('') params: SetupEmailServiceModel,
  ): Promise<SetupEmailResponse> {
    const setupResponse = await lastValueFrom(
      this.emailService.setup({
        sendgridKey: params.sendgridKey,
        projectId: apiKey.project.id,
        environment: apiKey.environment,
      }),
    );

    return new SetupEmailResponse(setupResponse);
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
  async registerSenderAddress(
    @ApiKey() apiKey: AuthCommonProto.ApiKey,
    @Body('') params: RegisterEmailModel,
  ) {
    await lastValueFrom(
      this.emailService.registerSender({
        fromName: params.name,
        fromEmail: params.email,
        replyTo: params.replyTo ?? params.email,
        configId: apiKey.project.id,
        configEnvironment: apiKey.environment,
        nickname: params.nickname ?? params.name,
        address: params.address,
        city: params.city,
        state: params.state,
        zip: params.zip,
        country: params.country,
      }),
    );

    return new RegisterEmailResponse(params.email);
  }

  @ApiOperation({
    summary: 'Registers a sender domain with SendGrid.',
  })
  @ApiCreatedResponse({
    description: 'Domain registered successfully',
    type: RegisterDomainResponse,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiBadRequestResponse({ description: 'Bad request' })
  @Post('/register-domain')
  async registerEmailDomain(
    @ApiKey() apiKey: AuthCommonProto.ApiKey,
    @Body() req: RegisterDomainModel,
  ): Promise<RegisterDomainResponse> {
    if (!req.domain) {
      throw new HttpException(
        'Cannot register domain (no domain supplied)',
        HttpStatus.BAD_REQUEST,
      );
    }

    const res = await lastValueFrom(
      this.emailService.authenticateDomain({
        domain: req.domain,
        subdomain: req.subdomain,
        configId: apiKey.project.id,
        configEnvironment: apiKey.environment,
      }),
    );

    return new RegisterDomainResponse(res);
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
    @ApiKey() apiKey: AuthCommonProto.ApiKey,
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
      configId: apiKey.project.id,
      configEnvironment: apiKey.environment,
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
  async sendEmail(
    @ApiKey() apiKey: AuthCommonProto.ApiKey,
    @Body() req: SendEmailModel,
  ): Promise<SendEmailResponse> {
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
          cc: req.cc,
          bcc: req.bcc,
          sender: {
            email: req.sender.email,
            name: req.sender.name,
          },
          replyToList: req.replyToList,
          subject: req.subject,
          content: req.content,
          configId: apiKey.project.id,
          configEnvironment: apiKey.environment,
        }),
      ),
    );
  }
}
