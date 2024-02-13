import { Injectable } from '@nestjs/common';
import { ApiKey, Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class AuthService {
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

  async apiKey(lookup: Prisma.ApiKeyWhereUniqueInput): Promise<ApiKey> {
    return this.prisma.apiKey.findUnique({
      where: lookup,
    });
  }

  async createApiKey(input: Prisma.ApiKeyCreateInput): Promise<ApiKey> {
    return this.prisma.apiKey.create({
      data: input,
    });
  }
}
