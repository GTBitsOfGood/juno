import { Injectable } from '@nestjs/common';
import { FeatureFlag, Prisma } from '@prisma/client';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { FeatureFlagProto } from 'juno-proto';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class FeatureFlagService {
  constructor(private prisma: PrismaService) {}

  async createFlag(
    request: FeatureFlagProto.CreateFlagRequest,
  ): Promise<FeatureFlag> {
    try {
      return await this.prisma.featureFlag.create({
        data: {
          id: request.id,
          enabled: request.enabled,
          description: request.description,
        },
      });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new RpcException({
          code: status.ALREADY_EXISTS,
          message: `Feature flag with id '${request.id}' already exists`,
        });
      }
      throw e;
    }
  }

  async getFlag(
    request: FeatureFlagProto.GetFlagRequest,
  ): Promise<FeatureFlag> {
    const flag = await this.prisma.featureFlag.findUnique({
      where: {
        id: request.id,
      },
    });

    if (!flag) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: `Feature flag with id '${request.id}' not found`,
      });
    }

    return flag;
  }

  async setFlag(
    request: FeatureFlagProto.SetFlagRequest,
  ): Promise<FeatureFlag> {
    try {
      return await this.prisma.featureFlag.update({
        where: {
          id: request.id,
        },
        data: {
          ...(request.updateParams?.enabled !== undefined && {
            enabled: request.updateParams.enabled,
          }),
          ...(request.updateParams?.description !== undefined && {
            description: request.updateParams.description,
          }),
        },
      });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2025'
      ) {
        throw new RpcException({
          code: status.NOT_FOUND,
          message: `Feature flag with id '${request.id}' not found`,
        });
      }
      throw e;
    }
  }

  async deleteFlag(
    request: FeatureFlagProto.DeleteFlagRequest,
  ): Promise<FeatureFlagProto.DeleteFlagResponse> {
    try {
      await this.prisma.featureFlag.delete({
        where: {
          id: request.id,
        },
      });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2025'
      ) {
        throw new RpcException({
          code: status.NOT_FOUND,
          message: `Feature flag with id '${request.id}' not found`,
        });
      }
      throw e;
    }

    return {
      success: true,
    };
  }
}
