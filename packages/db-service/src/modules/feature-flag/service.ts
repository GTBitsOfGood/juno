import { Injectable } from '@nestjs/common';
import { FeatureFlag } from '@prisma/client';
import { FeatureFlagProto } from 'juno-proto';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class FeatureFlagService {
  constructor(private prisma: PrismaService) {}

  async createFlag(
    request: FeatureFlagProto.CreateFlagRequest,
  ): Promise<FeatureFlag> {
    return this.prisma.featureFlag.create({
      data: {
        id: request.id,
        enabled: request.enabled,
        description: request.description,
      },
    });
  }

  async getFlag(
    request: FeatureFlagProto.GetFlagRequest,
  ): Promise<FeatureFlag> {
    return this.prisma.featureFlag.findUnique({
      where: {
        id: request.id,
      },
    });
  }

  // only updates description if it was provided in the request (leave unchanged if request.description is undefined)
  async setFlag(
    request: FeatureFlagProto.SetFlagRequest,
  ): Promise<FeatureFlag> {
    return this.prisma.featureFlag.update({
      where: {
        id: request.id,
      },
      data: {
        enabled: request.enabled,
        ...(request.description !== undefined && { description: request.description }),
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

