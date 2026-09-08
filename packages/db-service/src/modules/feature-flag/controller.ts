import { Controller } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { Prisma } from '@prisma/client';
import { FeatureFlagService } from './service';
import { FeatureFlagProto } from 'juno-proto';
import { FeatureFlagServiceController } from 'juno-proto/dist/gen/feature-flag';

@Controller()
@FeatureFlagProto.FeatureFlagMethods()
export class FeatureFlagController implements FeatureFlagProto.FeatureFlagController {
  constructor(private readonly featureFlagService: FeatureFlagService) {}
  
  async createFeatureFlag(
    request: FeatureFlagProto.CreateFeatureFlag,): Promise<FeatureFlagProto.FeatureFlag> {
      // todo
    }
}
    

