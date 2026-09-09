import { Injectable } from '@nestjs/common';
import { Prisma, FeatureFlag } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';

type FeatureFlagUpdateData = {
  enabled?: boolean;
  description?: string | null;
};

@Injectable()
export class FeatureFlagService {
  constructor(private prisma: PrismaService) {}

  async createFlag(input: Prisma.FeatureFlagCreateInput): Promise<FeatureFlag> {
    return this.prisma.featureFlag.create({
      data: input,
    });
  }

  async getFlag(id: string): Promise<FeatureFlag> {
    return this.prisma.featureFlag.findUnique({ where: { id } });
  }

  async setFlag(
    id: string,
    data: FeatureFlagUpdateData,
  ): Promise<FeatureFlag> {
    return this.prisma.featureFlag.update({
      where: { id },
      data,
    });
  }

  async deleteFlag(id: string): Promise<FeatureFlag> {
    return this.prisma.featureFlag.delete({ where: { id } });
  }
}
