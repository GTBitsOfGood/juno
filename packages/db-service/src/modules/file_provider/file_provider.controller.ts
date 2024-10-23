import { Controller } from '@nestjs/common';
import { IdentifierProto, EmailProto } from 'juno-proto';
import { EmailService } from './email.service';
import { validateEmailSenderIdentifier } from 'src/utility/validate';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import {
  EmailSender,
  EmailDbServiceController,
} from 'juno-proto/dist/gen/email';

@Controller()
@EmailProto.EmailDbServiceControllerMethods()
export class EmailController implements EmailDbServiceController {
  constructor(private readonly emailService: EmailService) {}
  async createEmailServiceConfig(
    request: EmailProto.CreateEmailServiceConfigRequest,
  ): Promise<EmailProto.EmailServiceConfig> {
    const config = await this.emailService.createEmailServiceConfig({
      environment: request.environment,
      sendgridApiKey: request.sendgridKey,
      Project: {
        connect: {
          id: Number(request.projectId),
        },
      },
    });

    return {
      id: config.id,
      environment: config.environment,
      sendgridKey: config.sendgridApiKey,
      senders: [],
      domains: [],
    };
  }
}
