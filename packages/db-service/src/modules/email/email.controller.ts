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

  async getEmailSender(
    identifier: IdentifierProto.EmailSenderIdentifier,
  ): Promise<EmailSender> {
    const params = validateEmailSenderIdentifier(identifier);

    const emailSender = await this.emailService.emailSender(params);

    if (!emailSender) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: 'Email not found',
      });
    }

    return {
      username: emailSender.username,
      description: emailSender.description,
      projects: emailSender.attachedConfigs.map((config) => {
        return {
          id: config.configId,
        };
      }),
      domain: emailSender.domain,
    };
  }

  async createEmailSender(
    request: EmailProto.CreateEmailSenderRequest,
  ): Promise<EmailSender> {
    await this.emailService.createOrGetEmailServiceConfig({
      Project: {
        connect: {
          id: Number(request.configId),
        },
      },
    });

    try {
      const existing = await this.emailService.emailSender({
        username_domain: {
          username: request.username,
          domain: request.domain,
        },
      });

      const mapped = existing.attachedConfigs.map((config) => config.configId);

      if (mapped.includes(Number(request.configId))) {
        throw new RpcException({
          code: status.ALREADY_EXISTS,
          message: 'Sender already exists',
        });
      }
    } catch (e) {
      if (e instanceof RpcException) {
        throw e;
      }
    }

    const emailSender = await this.emailService.createEmailSender({
      username: request.username,
      attachedConfigs: {
        connectOrCreate: {
          where: {
            configId_username_domain: {
              configId: Number(request.configId),
              username: request.username,
              domain: request.domain,
            },
          },
          create: {
            configId: Number(request.configId),
          },
        },
      },
      description: request.description,
      domainItem: {
        connect: {
          domain: request.domain,
        },
      },
    });
    return {
      username: emailSender.username,
      description: emailSender.description,
      projects: emailSender.attachedConfigs.map((config) => {
        return {
          id: config.configId,
        };
      }),
      domain: emailSender.domain,
    };
  }

  async updateEmailSender(
    request: EmailProto.UpdateEmailSenderRequest,
  ): Promise<EmailSender> {
    const emailFind = validateEmailSenderIdentifier(
      request.emailSenderIdentifier,
    );
    const emailSender = await this.emailService.updateEmailSender(emailFind, {
      description: request.updateParams.description,
    });
    return {
      username: emailSender.username,
      description: emailSender.description,
      projects: emailSender.attachedConfigs.map((config) => {
        return {
          id: config.configId,
        };
      }),
      domain: emailSender.domain,
    };
  }

  async deleteEmailSender(
    request: EmailProto.DeleteEmailSenderRequest,
  ): Promise<EmailSender> {
    const emailParams = validateEmailSenderIdentifier(
      request.emailSenderIdentifier,
    );

    const emailSender = await this.emailService.deleteEmailSender(
      emailParams,
      request.configId,
    );

    return {
      username: emailSender.username,
      description: emailSender.description,
      projects: emailSender.attachedConfigs.map((config) => {
        return {
          id: config.configId,
        };
      }),
      domain: emailSender.domain,
    };
  }

  async createEmailDomain(
    request: EmailProto.CreateEmailDomainRequest,
  ): Promise<EmailProto.EmailDomain> {
    await this.emailService.createOrGetEmailServiceConfig({
      Project: {
        connect: {
          id: Number(request.configId),
        },
      },
    });

    const emailDomain = await this.emailService.createEmailDomain({
      domain: request.domain,
      subdomain: request.subdomain,
      sendgridId: request.sendgridId,
      attachedConfigs: {
        connect: {
          id: Number(request.configId),
        },
      },
    });
    return {
      domain: emailDomain.domain,
      subdomain: emailDomain.subdomain,
      sendgridId: emailDomain.sendgridId,
      projects: emailDomain.attachedConfigs.map((config) => {
        return {
          id: config.id,
        };
      }),
    };
  }

  async getEmailDomain(
    request: EmailProto.EmailDomainRequest,
  ): Promise<EmailProto.EmailDomain> {
    const domain = await this.emailService.emailDomain({
      domain: request.domain,
    });
    if (!domain) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: 'Domain not found',
      });
    }
    return {
      domain: domain.domain,
      subdomain: domain.subdomain,
      sendgridId: domain.sendgridId,
      projects: domain.attachedConfigs.map((config) => {
        return {
          id: config.id,
        };
      }),
    };
  }
}
