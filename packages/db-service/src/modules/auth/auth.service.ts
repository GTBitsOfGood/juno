import { status } from '@grpc/grpc-js';
import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { ApiKey, Prisma } from '@prisma/client';
import { AuthCommonProto } from 'juno-proto';
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
  ): Promise<AuthCommonProto.ApiKey[]> {
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
  ): Promise<AuthCommonProto.ApiKey> {
    return convertDbApiKeyToTs(
      await this.prisma.apiKey.findUnique({
        where: lookup,
      }),
    );
  }

  async findApiKey(
    lookup: Prisma.ApiKeyWhereUniqueInput,
  ): Promise<AuthCommonProto.ApiKey | undefined> {
    const key = await this.prisma.apiKey.findUnique({
      where: lookup,
      include: { project: true },
    });
    if (!key) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: 'Api key not found',
      });
    }
    return convertDbApiKeyToTs(key);
  }

  async createApiKey(
    input: Prisma.ApiKeyCreateInput,
  ): Promise<AuthCommonProto.ApiKey> {
    try {
      let projectId: number | undefined = undefined;
      if (input.project.connect.id) {
        if (Number.isInteger(input.project.connect.id)) {
          projectId = Number(input.project.connect.id);
        }
      } else if (input.project.connect.name) {
        const name = input.project.connect.name.toString();
        const project = await this.prisma.project.findUnique({
          where: { name: name },
        });
        if (!project) {
          throw new RpcException({
            code: status.INVALID_ARGUMENT,
            message: 'Project not found',
          });
        }
        projectId = project.id;
      }

      if (projectId == undefined) {
        throw new RpcException({
          code: status.INVALID_ARGUMENT,
          message: 'Project not found',
        });
      }

      const prismaApiKey = await this.prisma.apiKey.create({
        data: {
          hash: input.hash,
          description: input.description ?? '',
          scopes: [],
          projectId: projectId,
          environment: input.environment,
        },
        include: {
          project: true,
        },
      });
      return convertDbApiKeyToTs(prismaApiKey);
    } catch (error) {
      if (error instanceof RpcException) throw error;
      throw new RpcException({
        code: status.FAILED_PRECONDITION,
        message: 'Error creating API key',
      });
    }
  }

  async deleteApiKey(
    lookup: Prisma.ApiKeyWhereUniqueInput,
  ): Promise<AuthCommonProto.ApiKey> {
    const key = await this.prisma.apiKey.delete({
      where: lookup,
    });
    return convertDbApiKeyToTs(key);
  }
}
const convertDbApiKeyToTs = (key: ApiKey): AuthCommonProto.ApiKey => {
  const mappedScopes = key.scopes.map((scope) => {
    switch (scope) {
      case 'FULL':
        return AuthCommonProto.ApiScope.FULL;
      default:
        throw new RpcException({
          code: status.FAILED_PRECONDITION,
          message: `Unknown Api scope: ${scope}`,
        });
    }
  });

  const apiKey: AuthCommonProto.ApiKey = {
    id: key.id.toString(),
    hash: key.hash,
    scopes: mappedScopes,
    description: key.description,
    project: { id: key.projectId },
    environment: key.environment,
  };
  return apiKey;
};
