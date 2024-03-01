import { Injectable } from '@nestjs/common';
import { Email, Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class EmailService {
  constructor(private prisma: PrismaService) {}

  async emails(
    skip?: number,
    take?: number,
    cursor?: Prisma.EmailWhereUniqueInput,
    where?: Prisma.EmailWhereInput,
    orderBy?: Prisma.EmailOrderByWithRelationInput,
  ): Promise<Email[]> {
    return this.prisma.email.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }

  async email(lookup: Prisma.EmailWhereUniqueInput): Promise<Email> {
    return this.prisma.email.findUnique({
      where: lookup,
    });
  }

  async createEmail(input: Prisma.EmailCreateInput): Promise<Email> {
    return this.prisma.email.create({
      data: input,
    });
  }

  async updateEmail(
    project: Prisma.EmailWhereUniqueInput,
    update: Prisma.EmailUpdateInput,
  ): Promise<Email> {
    return this.prisma.email.update({
      where: project,
      data: update,
    });
  }

  async deleteEmail(where: Prisma.EmailWhereUniqueInput): Promise<Email> {
    return this.prisma.email.delete({
      where,
    });
  }
}
