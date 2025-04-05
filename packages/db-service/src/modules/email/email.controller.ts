import { status } from '@grpc/grpc-js';
import { Controller } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { EmailProto, IdentifierProto } from 'juno-proto';
import {
  EmailDbServiceController,
  EmailSender,
} from 'juno-proto/dist/gen/email';
import { validateEmailSenderIdentifier } from 'src/utility/validate';
import { EmailService } from './email.service';

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
  async getEmailServiceConfig(
    request: EmailProto.GetEmailServiceConfigRequest,
  ): Promise<EmailProto.EmailServiceConfig> {
    const config = await this.emailService.getEmailServiceConfig({
      id_environment: {
        id: Number(request.id),
        environment: request.environment,
      },
    });

    if (!config) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: `Email config not found for environment "${request.environment}." Are your config matches this environment?`,
      });
    }

    return {
      id: config.id,
      environment: config.environment,
      sendgridKey: config.sendgridApiKey,
      senders: [],
      domains: [],
    };
  }

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
    const config = await this.emailService.getEmailServiceConfig({
      id_environment: {
        id: Number(request.configId),
        environment: request.configEnvironment,
      },
    });

    if (!config) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: 'Config not found',
      });
    }

    try {
      const existing = await this.emailService.emailSender({
        username_domain: {
          username: request.username,
          domain: request.domain,
        },
      });

      const mapped = existing.attachedConfigs.map(
        (config) => `${config.configId}_${config.configEnv}`,
      );

      if (mapped.includes(`${request.configId}_${request.configEnvironment}`)) {
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
          create: {
            configId: Number(request.configId),
            configEnv: request.configEnvironment,
          },
          where: {
            configId_configEnv_username_domain: {
              configId: Number(request.configId),
              configEnv: request.configEnvironment,
              domain: request.domain,
              username: request.username,
            },
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
      request.configEnvironment,
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
    const config = await this.emailService.getEmailServiceConfig({
      id_environment: {
        id: Number(request.configId),
        environment: request.configEnvironment,
      },
    });

    if (!config) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: 'Config not found',
      });
    }

    const emailDomain = await this.emailService.createEmailDomain({
      domain: request.domain,
      subdomain: request.subdomain,
      sendgridId: request.sendgridId,
      attachedConfigs: {
        connectOrCreate: {
          create: {
            configId: Number(request.configId),
            configEnv: request.configEnvironment,
          },
          where: {
            configId_configEnv_domainStr: {
              configId: Number(request.configId),
              configEnv: request.configEnvironment,
              domainStr: request.domain,
            },
          },
        },
      },
    });

    return {
      domain: emailDomain.domain,
      subdomain: emailDomain.subdomain,
      sendgridId: emailDomain.sendgridId,
      projects: emailDomain.attachedConfigs.map((config) => {
        return {
          id: config.configId,
          environment: config.configEnv,
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
          id: config.configId,
          environment: config.configEnv,
        };
      }),
    };
  }
}
