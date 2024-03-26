import { Controller } from '@nestjs/common';
import { IdentifierProto, EmailProto } from 'juno-proto';
import { EmailService } from './email.service';
import {
  validateEmailIdentifier,
  validateProjectIdentifier,
} from 'src/utility/validate';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { Email, EmailDbServiceController } from 'juno-proto/dist/gen/email';

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

    return {
      name: email.name,
      description: email.description,
      project: {
        id: email.projectId,
      },
    };
  }

  async createEmail(request: EmailProto.CreateEmailRequest): Promise<Email> {
    const email = await this.emailService.createEmail({
      name: request.name,
      project: {
        connect: validateProjectIdentifier(request.project),
      },
      description: request.description,
    });
    return {
      name: email.name,
      description: email.description,
      project: {
        id: email.projectId,
      },
    };
  }

  async updateEmail(request: EmailProto.UpdateEmailRequest): Promise<Email> {
    const emailFind = validateEmailIdentifier(request.emailIdentifier);
    const email = await this.emailService.updateEmail(emailFind, {
      description: request.updateParams.description,
    });
    return {
      name: email.name,
      description: email.description,
      project: {
        id: email.projectId,
      },
    };
  }

  async deleteEmail(
    identifier: IdentifierProto.EmailIdentifier,
  ): Promise<Email> {
    const emailParams = validateEmailIdentifier(identifier);

    const email = await this.emailService.deleteEmail(emailParams);

    return {
      name: email.name,
      description: email.description,
      project: {
        id: email.projectId,
      },
    };
  }
}
