import { Controller } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { FeatureFlagService } from './feature_flag.service';
import { FeatureFlagProto } from 'juno-proto';
import { FeatureFlagDbServiceController } from 'juno-proto/dist/gen/feature_flag';

@Controller()
@FeatureFlagProto.FeatureFlagDbServiceControllerMethods()
export class FeatureFlagController implements FeatureFlagDbServiceController {
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
    if (request.enabled === undefined) {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: 'Provided Flag enabled value is invalid',
      });
    }

    return this.featureFlagService.createFlag({
      id: request.id,
      enabled: request.enabled,
      description: request.description,
    });
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

    return this.featureFlagService.getFlag(request.id);
  }

  async setFlag(
    request: FeatureFlagProto.SetFlagRequest,
  ): Promise<FeatureFlagProto.FeatureFlag> {
    if (!request.id || request.id.trim() === '') {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: 'Provided Flag ID is invalid',
      });
    }

    return this.featureFlagService.setFlag(request.id, {
      enabled: request.enabled,
      description: request.description,
    });
  }

  async deleteFlag(
    request: FeatureFlagProto.DeleteFlagRequest,
  ): Promise<FeatureFlagProto.DeleteFlagResponse> {
    if (!request.id || request.id.trim() === '') {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: 'Provided Flag ID is invalid',
      });
    }

    return this.featureFlagService.deleteFlag(request.id);
  }
}
