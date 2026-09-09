import { Controller } from '@nestjs/common';
import { FeatureFlagProto } from 'juno-proto';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { FeatureFlagService } from './feature_flag.service';
import { Prisma } from '@prisma/client';

@Controller()
@FeatureFlagProto.FeatureFlagServiceControllerMethods()
export class FeatureFlagController
  implements FeatureFlagProto.FeatureFlagServiceController
{
  constructor(private readonly featureFlagService: FeatureFlagService) {}

  async createFlag(
    request: FeatureFlagProto.CreateFlagRequest,
  ): Promise<FeatureFlagProto.FeatureFlag> {
    try {
      const flag = await this.featureFlagService.createFlag({
        id: request.id,
        enabled: request.enabled,
        description: request.description,
      });
      return flag;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new RpcException({
          code: status.ALREADY_EXISTS,
          message: 'Feature flag with this id already exists',
        });
      }
      throw error;
    }
  }

  async getFlag(
    request: FeatureFlagProto.GetFlagRequest,
  ): Promise<FeatureFlagProto.FeatureFlag> {
    const flag = await this.featureFlagService.getFlag(request.id);

    if (!flag) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: 'Flag not found',
      });
    }

    return flag;
  }

  async setFlag(
    request: FeatureFlagProto.SetFlagRequest,
  ): Promise<FeatureFlagProto.FeatureFlag> {
    const flag = await this.featureFlagService.setFlag(request.id, {
      enabled: request.enabled,
      description: request.description,
    });
    return flag;
  }

  async deleteFlag(
    request: FeatureFlagProto.DeleteFlagRequest,
  ): Promise<FeatureFlagProto.FeatureFlag> {
    const flag = await this.featureFlagService.deleteFlag(request.id);
    return flag;
  }
}
