import { Injectable } from '@nestjs/common';
import { FeatureFlag } from '@prisma/client';
import { FeatureFlagProto } from 'juno-proto';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class FeatureFlagService {
  constructor(private prisma: PrismaService) {}

  async createFlag(
    request: FeatureFlagProto.FeatureFlag,
  ): Promise<FeatureFlag> {
    return this.prisma.FeatureFlag.create({
      data: {
        id: request.id,
        enabled: request.enabled,
        description: request.description,
      },
    });
  }

  async getFlag(
    request: FeatureFlagProto.FeatureFlag,
  ): Promise<FeatureFlag> {
    return this.prisma.FeatureFlag.findUnique({
      where: {
        id: request.id,
      },
    });
  }

  // might need checks if description was not included in request (since optional field)
  async setFlag(
    request: FeatureFlagProto.FeatureFlag,
  ): Promise<FeatureFlag> {
    return this.prisma.FeatureFlag.update({
      where: {
        id: request.id,
      },
      data: {
        enabled: request.enabled,
        description: request.description,
      },
    });
  }

  async deleteFlag(
    request: FeatureFlagProto.DeleteFlagRequest,
  ): Promise<FeatureFlagProto.DeleteFlagResponse> {
    await this.prisma.featureFlag.delete({
      where: {
        id: request.id,
      },
    });
  

    return {
      success: true,
    };
  }
}

