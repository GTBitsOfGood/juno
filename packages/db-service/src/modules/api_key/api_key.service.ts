import { Injectable } from '@nestjs/common';
import { ApiKey, Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class ApiKeyService {
  constructor(private prisma: PrismaService) {}

  async getApiKey(hash?: string, id?: number): Promise<ApiKey> {
    if (!id) {
      return this.prisma.apiKey.findFirst({ where: { id } });
    }
    return this.prisma.apiKey.findFirst({ where: { hash } });
  }

  async createApiKey(input: Prisma.ApiKeyCreateInput): Promise<ApiKey> {
    return this.prisma.apiKey.create({
      data: input,
    });
  }

  async deleteApiKey(where: Prisma.ApiKeyWhereUniqueInput): Promise<ApiKey> {
    return this.prisma.apiKey.delete({
      where,
    });
  }

  async deleteAllProjectApiKeys(
    projectName: string,
  ): Promise<Prisma.BatchPayload> {
    return this.prisma.apiKey.deleteMany({
      where: {
        project: {
          name: projectName,
        },
      },
    });
  }
}
