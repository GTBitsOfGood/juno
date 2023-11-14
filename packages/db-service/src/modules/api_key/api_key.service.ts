import { Injectable } from '@nestjs/common';
import { ApiKey, Prisma } from '@prisma/client';
import { ProjectIdentifier } from 'src/gen/shared/identifiers';
import { PrismaService } from 'src/prisma.service';

type ApiKeyWithProject = ApiKey & { project: ProjectIdentifier };

@Injectable()
export class ApiKeyService {
  constructor(private prisma: PrismaService) {}

  async apiKeys(
    skip?: number,
    take?: number,
    cursor?: Prisma.ApiKeyWhereUniqueInput,
    where?: Prisma.ApiKeyWhereInput,
    orderBy?: Prisma.ApiKeyOrderByWithRelationInput,
  ): Promise<ApiKey[]> {
    return this.prisma.apiKey.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }

  async apiKey(
    lookup: Prisma.ApiKeyWhereUniqueInput,
  ): Promise<ApiKeyWithProject> {
    return this.prisma.apiKey.findUnique({
      where: lookup,
      include: {
        project: true,
      },
    });
  }

  async createApiKey(
    input: Prisma.ApiKeyCreateInput,
  ): Promise<ApiKeyWithProject> {
    return this.prisma.apiKey.create({
      data: input,
      include: {
        project: true,
      },
    });
  }

  async updateApiKey(
    apiKey: Prisma.ApiKeyWhereUniqueInput,
    update: Prisma.ApiKeyUpdateInput,
  ): Promise<ApiKeyWithProject> {
    return this.prisma.apiKey.update({
      where: apiKey,
      data: update,
      include: {
        project: true,
      },
    });
  }

  async deleteApiKey(
    where: Prisma.ApiKeyWhereUniqueInput,
  ): Promise<ApiKeyWithProject> {
    return this.prisma.apiKey.delete({
      where,
      include: {
        project: true,
      },
    });
  }
}
