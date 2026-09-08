import { Controller } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { Prisma } from '@prisma/client';
import { FeatureFlagService } from './service';
import { FeatureFlagProto } from 'juno-proto';
import { FeatureFlagServiceController } from 'juno-proto/dist/gen/feature_flag';

@Controller()
@FeatureFlagProto.FeatureFlagControllerMethods()
export class FeatureFlagController implements FeatureFlagServiceController {
  constructor(private readonly featureFlagService: FeatureFlagService) {}
  
  async createFlag(
    request: FeatureFlagProto.CreateFlagRequest,
  ): Promise<FeatureFlagProto.FeatureFlag> {
      if (!request.id || request.id.trim() === '') {
        throw new RpcException({
          code: status.INVALID_ARGUMENT,
          message: 'Provided Flag ID is invalid',
        });
    }
    const featureFlag = await this.featureFlagService.createFlag(request);
    return featureFlag;
    }

    async getFlag(
      request: FeatureFlagProto.GetFlagRequest,
    ): Promise<FeatureFlagProto.FeatureFlag> {
      if (!request.id || request.id.trim() === '') {
        throw new RpcException({
          code: status.INVALID_ARGUMENT,
          message: 'Provided Flag ID is invalid',
        });
      }

      const featureFlag = await this.featureFlagService.getFlag(request);
      return featureFlag;
    }

    async setFlag(
      request: FeatureFlagProto.SetFlagRequest,
    ): Promise<FeatureFlagProto.FeatureFlag> {
      if (!request.id || request.id.trim === '') {
        throw new RpcException({
          code: status.INVALID_ARGUMENT,
          message: 'Provided Flag ID is invalid',
        });
      }

      const featureFlag = await this.featureFlagService.setFlag(request);
      return featureFlag
    }

    async deleteFlag(
      request: FeatureFlagProto.DeleteFlagRequest,
    ): Promise<FeatureFlagProto.DeleteFlagResponse> {
      if (!request.id || request.id.trim === '') {
        throw new RpcException({
          code: status.INVALID_ARGUMENT,
          message: 'Provided Flag ID is invalid',
        });
      }
      
      const deleteResponse = await this.featureFlagService.deleteFlag(request);
      return deleteResponse;
    }
}

