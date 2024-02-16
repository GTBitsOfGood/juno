import { Injectable } from '@nestjs/common';
import { ApiKey, Prisma } from '@prisma/client';
import { ApiKeyProto } from 'juno-proto';
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
  ): Promise<ApiKeyProto.ApiKey[]> {
    const apiKeys = await this.prisma.apiKey.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
    return apiKeys.map((key) => convertDbApiKeyToTs(key));
  }

  async apiKey(
    lookup: Prisma.ApiKeyWhereUniqueInput,
  ): Promise<ApiKeyProto.ApiKey> {
    return convertDbApiKeyToTs(
      await this.prisma.apiKey.findUnique({
        where: lookup,
      }),
    );
  }

  async createApiKey(
    input: Prisma.ApiKeyCreateInput,
  ): Promise<ApiKeyProto.ApiKey> {
    let projectId: number;

    // Check if the project identifier provides an ID directly
    if ('id' in input.project) {
      if (Number.isInteger(input.project.id)) {
        projectId = Number(input.project.id);
      }
    } else if ('name' in input.project) {
      const name = input.project.name.toString();
      const project = await this.prisma.project.findUnique({
        where: { name: name },
      });
      if (!project) {
        throw new Error('Project not found');
      }
      projectId = project.id;
    }

    if (!projectId) {
      throw new Error('Project ID is required');
    }

    const prismaApiKey = await this.prisma.apiKey.create({
      data: {
        hash: input.hash,
        description: input.description,
        scopes: input.scopes,
        projectId: projectId,
      },
      include: {
        project: true,
      },
    });
    return convertDbApiKeyToTs(prismaApiKey);
  }
}

const convertDbApiKeyToTs = (key: ApiKey): ApiKeyProto.ApiKey => {
  const mappedScopes = key.scopes.map((scope) => {
    switch (scope) {
      case 'FULL':
        return ApiKeyProto.ApiScope.FULL;
      default:
        throw new Error(`Unknown scope: ${scope}`);
    }
  });

  const apiKey: ApiKeyProto.ApiKey = {
    id: key.id.toString(),
    hash: key.hash,
    scopes: mappedScopes,
    description: key.description,
    project: { id: key.projectId },
  };
  return apiKey;
};
