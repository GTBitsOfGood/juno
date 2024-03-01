import { Controller } from '@nestjs/common';
import { IdentifierProto, EmailProto } from 'juno-proto';
import { EmailService } from './email.service';
import { Email, Project } from '@prisma/client';
import { validateEmailIdentifier } from 'src/utility/validate';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';

@Controller()
@EmailProto.EmailServiceControllerMethods()
export class EmailController {
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
    const project = await this.emailService.updateEmail(emailFind, {
      description: request.updateParams.description,
    });
    return project;
  }

  async deleteEmail(
    identifier: IdentifierProto.EmailIdentifier,
  ): Promise<Email> {
    const emailParams = validateEmailIdentifier(identifier);

    return this.emailService.deleteEmail(emailParams);
  }
}
