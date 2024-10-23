import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class FileProviderService {
  constructor(private prisma: PrismaService) {}

  //   async createEmailSender(
  //     input: Prisma.EmailSenderCreateInput,
  //   ): Promise<EmailSenderWithConfigIds> {
  //     return this.prisma.emailSender.upsert({
  //       where: {
  //         username_domain: {
  //           username: input.username,
  //           domain: input.domainItem.connect.domain,
  //         },
  //       },
  //       create: input,
  //       update: {
  //         attachedConfigs: {
  //           connectOrCreate: input.attachedConfigs.connectOrCreate,
  //         },
  //       },
  //       ...senderWithConfigIds,
  //     });
  //   }
}
