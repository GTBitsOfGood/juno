import { status } from '@grpc/grpc-js';
import { Controller } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { FeatureFlagProto } from 'juno-proto';
import { FeatureFlagServiceController } from 'juno-proto/dist/gen/feature_flag';
import { FeatureFlagService } from './feature_flag.service';

@Controller()
@FeatureFlagProto.FeatureFlagServiceControllerMethods()
export class FeatureFlagController implements FeatureFlagServiceController {
  constructor(private readonly featureFlagService: FeatureFlagService) {}

  async createFlag(
    request: FeatureFlagProto.CreateFlagRequest,
  ): Promise<FeatureFlagProto.CreateFlagResponse> {
    const flag = await this.featureFlagService.createFlag({
      id: request.id,
      enabled: request.enabled,
      description: request.description,
    });

    return { flag };
  }

  async getFlag(
    request: FeatureFlagProto.GetFlagRequest,
  ): Promise<FeatureFlagProto.GetFlagResponse> {
    const flag = await this.featureFlagService.getFlag({ id: request.id });

    if (!flag) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: `Feature flag "${request.id}" not found`,
      });
    }

    return { flag };
  }

  async setFlag(
    request: FeatureFlagProto.SetFlagRequest,
  ): Promise<FeatureFlagProto.SetFlagResponse> {
    const existing = await this.featureFlagService.getFlag({
      id: request.id,
    });

    if (!existing) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: `Feature flag "${request.id}" not found`,
      });
    }

    const flag = await this.featureFlagService.setFlag(
      { id: request.id },
      {
        enabled: request.enabled,
        description: request.description,
      },
    );

    return { flag };
  }

  async deleteFlag(
    request: FeatureFlagProto.DeleteFlagRequest,
  ): Promise<FeatureFlagProto.DeleteFlagResponse> {
    const existing = await this.featureFlagService.getFlag({
      id: request.id,
    });

    if (!existing) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: `Feature flag "${request.id}" not found`,
      });
    }

    await this.featureFlagService.deleteFlag({ id: request.id });

    return { success: true };
  }
}
