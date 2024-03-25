import { Controller } from '@nestjs/common';
import { IdentifierProto, EmailProto } from 'juno-proto';
import { EmailService } from './email.service';
import { Email } from '@prisma/client';
import { validateEmailIdentifier } from 'src/utility/validate';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { EmailDbServiceController } from 'juno-proto/dist/gen/email';

@Controller()
@EmailProto.EmailDbServiceControllerMethods()
export class EmailController implements EmailDbServiceController {
  constructor(private readonly emailService: EmailService) {}

  async getEmail(identifier: IdentifierProto.EmailIdentifier): Promise<Email> {
    const params = validateEmailIdentifier(identifier);

    const email = await this.emailService.email(params);

    if (!email) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: 'Email not found',
      });
    }

    return email;
  }

  async createEmail(request: EmailProto.CreateEmailRequest): Promise<Email> {
    const email = await this.emailService.createEmail({
      name: request.name,
      project: {
        connect: {
          id: Number(request.project.id),
        },
      },
      description: request.description,
    });
    return email;
  }

  async updateEmail(request: EmailProto.UpdateEmailRequest): Promise<Email> {
    const emailFind = validateEmailIdentifier(request.emailIdentifier);
    const email = await this.emailService.updateEmail(emailFind, {
      description: request.updateParams.description,
    });
    return email;
  }

  async deleteEmail(
    identifier: IdentifierProto.EmailIdentifier,
  ): Promise<Email> {
    const emailParams = validateEmailIdentifier(identifier);

    return this.emailService.deleteEmail(emailParams);
  }
}
