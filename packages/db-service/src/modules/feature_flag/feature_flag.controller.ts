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
    if (!request.id || request.id.trim() === '') {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: 'Provided Flag ID is invalid',
      });
    }

    const featureFlag = await this.featureFlagService.setFlag(request);
    return featureFlag;
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

    const deleteResponse = await this.featureFlagService.deleteFlag(request);
    return deleteResponse;
  }
}
