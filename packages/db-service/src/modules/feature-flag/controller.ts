import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { FeatureFlagService } from './service';
import { FeatureFlag, CreateFlagRequest, GetFlagRequest,
         DeleteFlagRequest, DeleteFlagResponse } from '../../../../proto/src/gen/feature_flag';

@Controller()
export class FeatureFlagController {
  constructor(private readonly featureFlagService: FeatureFlagService) {}

  @GrpcMethod('FeatureFlagService')
  createFlag(data: CreateFlagRequest): Promise<FeatureFlag> {
    return this.featureFlagService.createFlag(data);
  }

  @GrpcMethod('FeatureFlagService')
  getFlag(data: GetFlagRequest): Promise<FeatureFlag> {
    return
    

