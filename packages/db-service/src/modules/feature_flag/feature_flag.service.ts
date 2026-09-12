import { Injectable } from '@nestjs/common';
import { FeatureFlag } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';

type CreateFlagData = {
  id: string;
  enabled: boolean;
  description?: string;
};

type UpdateFlagData = {
  enabled?: boolean;
  description?: string;
};

@Injectable()
export class FeatureFlagService {
  constructor(private prisma: PrismaService) {}

  async createFlag(data: CreateFlagData): Promise<FeatureFlag> {
    return this.prisma.featureFlag.create({
      data: {
        id: data.id,
        enabled: data.enabled,
        description: data.description,
      },
    });
  }

  async getFlag(id: string): Promise<FeatureFlag> {
    return this.prisma.featureFlag.findUnique({ where: { id } });
  }

  async setFlag(id: string, update: UpdateFlagData): Promise<FeatureFlag> {
    return this.prisma.featureFlag.update({
      where: { id },
      data: update,
    });
  }

  async deleteFlag(id: string): Promise<{ success: boolean }> {
    await this.prisma.featureFlag.delete({ where: { id } });
    return { success: true };
  }
}
