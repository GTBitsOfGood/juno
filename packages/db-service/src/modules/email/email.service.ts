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

  get rawPrisma() {
    return this.prisma;
  }
}
