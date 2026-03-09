import { status } from '@grpc/grpc-js';
import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { ApiKey, NewAccountRequest, Prisma, Role } from '@prisma/client';
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

  async createAccountRequest(
    input: Prisma.NewAccountRequestCreateInput,
  ): Promise<NewAccountRequest> {
    return this.prisma.newAccountRequest.create({ data: input });
  }

  async getAllAccountRequests(): Promise<NewAccountRequest[]> {
    return this.prisma.newAccountRequest.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async deleteAccountRequest(id: number): Promise<NewAccountRequest> {
    const existing = await this.prisma.newAccountRequest.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: `Account request with id ${id} not found`,
      });
    }
    return this.prisma.newAccountRequest.delete({ where: { id } });
  }

  async acceptAccountRequest(id: number): Promise<{
    user: {
      id: number;
      email: string;
      name: string;
      type: Role;
      projectIds: number[];
    };
    project?: { id: number; name: string };
  }> {
    let requestEmail: string | undefined;
    try {
      return await this.prisma.$transaction(async (tx) => {
        const request = await tx.newAccountRequest.findUnique({
          where: { id },
        });
        if (!request) {
          throw new RpcException({
            code: status.NOT_FOUND,
            message: `Account request with id ${id} not found`,
          });
        }

        requestEmail = request.email;

        let user = await tx.user.create({
          data: {
            email: request.email,
            name: request.name,
            password: request.password,
            type: request.userType,
          },
          include: {
            allowedProjects: {
              select: {
                id: true,
              },
            },
          },
        });

        let project: { id: number; name: string } | undefined;

        if (request.userType === Role.ADMIN && request.projectName) {
          let existingProject = await tx.project.findUnique({
            where: { name: request.projectName },
          });

          if (!existingProject) {
            existingProject = await tx.project.create({
              data: { name: request.projectName },
            });
          }

          user = await tx.user.update({
            where: { id: user.id },
            data: { allowedProjects: { connect: { id: existingProject.id } } },
            include: {
              allowedProjects: {
                select: {
                  id: true,
                },
              },
            },
          });

          project = { id: existingProject.id, name: existingProject.name };
        }

        await tx.newAccountRequest.delete({ where: { id } });

        return {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            type: user.type,
            projectIds: user.allowedProjects.map((project) => project.id),
          },
          project,
        };
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new RpcException({
            code: status.ALREADY_EXISTS,
            message: requestEmail
              ? `A user with email ${requestEmail} already exists`
              : 'A user with this email already exists',
          });
        }
        if (error.code === 'P2025') {
          throw new RpcException({
            code: status.NOT_FOUND,
            message: `Account request with id ${id} not found`,
          });
        }
      }
      throw error;
    }
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
