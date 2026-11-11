import { Injectable } from '@nestjs/common';
import { EmailServiceConfig, EmailSender, Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';

const senderWithConfigIds = {
  include: {
    attachedConfigs: {
      select: {
        configId: true,
        configEnv: true,
      },
    },
  },
};

const domainWithConfigIds = {
  include: {
    attachedConfigs: {
      select: {
        configId: true,
        configEnv: true,
      },
    },
  },
};

type EmailSenderWithConfigIds = Prisma.EmailSenderGetPayload<
  typeof senderWithConfigIds
>;

type EmailDomainWithConfigIds = Prisma.EmailDomainGetPayload<
  typeof domainWithConfigIds
>;

// conflict is true when another project already uses the SendGrid key; config
// is set otherwise. (A plain object type, not a discriminated union, because
// this package compiles without strictNullChecks, which breaks the narrowing.)
type CreateConfigResult = {
  conflict: boolean;
  config?: EmailServiceConfig;
};

@Injectable()
export class EmailService {
  constructor(private prisma: PrismaService) {}

  async emailSenders(
    skip?: number,
    take?: number,
    cursor?: Prisma.EmailSenderWhereUniqueInput,
    where?: Prisma.EmailSenderWhereInput,
    orderBy?: Prisma.EmailSenderOrderByWithRelationInput,
  ): Promise<EmailSender[]> {
    return this.prisma.emailSender.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }

  async emailSender(
    lookup: Prisma.EmailSenderWhereUniqueInput,
  ): Promise<EmailSenderWithConfigIds> {
    return this.prisma.emailSender.findUnique({
      where: lookup,
      ...senderWithConfigIds,
    });
  }

  async createEmailSender(
    input: Prisma.EmailSenderCreateInput,
  ): Promise<EmailSenderWithConfigIds> {
    return this.prisma.emailSender.upsert({
      where: {
        username_domain: {
          username: input.username,
          domain: input.domainItem.connect.domain,
        },
      },
      create: input,
      update: {
        attachedConfigs: {
          connectOrCreate: input.attachedConfigs.connectOrCreate,
        },
      },
      ...senderWithConfigIds,
    });
  }

  async updateEmailSender(
    emailSender: Prisma.EmailSenderWhereUniqueInput,
    update: Prisma.EmailSenderUpdateInput,
  ): Promise<EmailSenderWithConfigIds> {
    return this.prisma.emailSender.update({
      where: emailSender,
      data: update,
      ...senderWithConfigIds,
    });
  }

  async deleteEmailSender(
    where: Prisma.EmailSenderWhereUniqueInput,
    configId: number,
    configEnv: string,
  ): Promise<EmailSenderWithConfigIds> {
    await this.prisma.emailServiceConfigAndSender.delete({
      where: {
        configId_configEnv_username_domain: {
          configId: Number(configId),
          configEnv,
          username: where.username_domain.username,
          domain: where.username_domain.domain,
        },
      },
    });
    return this.prisma.emailSender.findUnique({
      where,
      ...senderWithConfigIds,
    });
  }

  async createEmailDomain(
    input: Prisma.EmailDomainCreateInput,
  ): Promise<EmailDomainWithConfigIds> {
    return this.prisma.emailDomain.upsert({
      where: {
        domain: input.domain,
      },
      create: input,
      update: {
        attachedConfigs: {
          connectOrCreate: input.attachedConfigs.connectOrCreate,
        },
      },
      ...domainWithConfigIds,
    });
  }

  async emailDomain(
    where: Prisma.EmailDomainWhereUniqueInput,
  ): Promise<EmailDomainWithConfigIds> {
    return this.prisma.emailDomain.findUnique({
      where,
      ...domainWithConfigIds,
    });
  }

  async createEmailServiceConfig(
    input: Prisma.EmailServiceConfigCreateInput,
  ): Promise<EmailServiceConfig> {
    return this.prisma.emailServiceConfig.upsert({
      where: {
        id_environment: {
          id: input.Project.connect.id,
          environment: input.environment,
        },
      },
      create: input,
      update: {
        sendgridApiKey: input.sendgridApiKey,
      },
    });
  }

  async getEmailServiceConfig(
    input: Prisma.EmailServiceConfigWhereUniqueInput,
  ): Promise<EmailServiceConfig> {
    return this.prisma.emailServiceConfig.findUnique({
      where: input,
    });
  }

  /**
   * Creates or updates a config while enforcing one SendGrid key per project
   * (configs for different environments of the same project may share a key).
   * The conflict check and the write run in one transaction, and a Postgres
   * advisory lock on the key serializes concurrent setups of the same key, so
   * two simultaneous requests can't both pass the check.
   */
  async createEmailServiceConfigWithUniqueKey(
    input: Prisma.EmailServiceConfigCreateInput,
  ): Promise<CreateConfigResult> {
    const projectId = input.Project.connect.id;

    return this.prisma.$transaction(async (tx): Promise<CreateConfigResult> => {
      if (input.sendgridApiKey) {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${input.sendgridApiKey}))`;

        const conflict = await tx.emailServiceConfig.findFirst({
          where: {
            sendgridApiKey: input.sendgridApiKey,
            NOT: { id: projectId },
          },
          select: { id: true },
        });
        if (conflict) {
          return { conflict: true };
        }
      }

      const config = await tx.emailServiceConfig.upsert({
        where: {
          id_environment: {
            id: projectId,
            environment: input.environment,
          },
        },
        create: input,
        update: {
          sendgridApiKey: input.sendgridApiKey,
        },
      });
      return { conflict: false, config };
    });
  }

  /** The link between a domain and one config, holding that config's SendGrid id. */
  async emailDomainLink(domain: string, configId: number, configEnv: string) {
    return this.prisma.emailServiceConfigAndDomain.findUnique({
      where: {
        configId_configEnv_domainStr: {
          configId,
          configEnv,
          domainStr: domain,
        },
      },
    });
  }

  async createVerifiedSender(input: {
    configId: number;
    configEnv: string;
    sendgridId: number;
    fromEmail: string;
  }) {
    return this.prisma.emailVerifiedSender.upsert({
      where: {
        configId_configEnv_sendgridId: {
          configId: input.configId,
          configEnv: input.configEnv,
          sendgridId: input.sendgridId,
        },
      },
      create: input,
      update: { fromEmail: input.fromEmail },
    });
  }

  /** SendGrid ids of the domains and verified senders recorded for a config. */
  async configResourceIds(configId: number, configEnv: string) {
    const [domains, senders] = await Promise.all([
      this.prisma.emailServiceConfigAndDomain.findMany({
        where: { configId, configEnv },
        select: { sendgridId: true },
      }),
      this.prisma.emailVerifiedSender.findMany({
        where: { configId, configEnv },
        select: { sendgridId: true },
      }),
    ]);
    return {
      domainSendgridIds: domains.map((d) => d.sendgridId),
      senderSendgridIds: senders.map((s) => s.sendgridId),
    };
  }

  get rawPrisma() {
    return this.prisma;
  }
}
