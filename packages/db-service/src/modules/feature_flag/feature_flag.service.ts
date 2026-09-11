import { Injectable } from '@nestjs/common';
import { FeatureFlag, Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class FeatureFlagService {
  constructor(private prisma: PrismaService) {}

  async createFlag(input: Prisma.FeatureFlagCreateInput): Promise<FeatureFlag> {
    return this.prisma.featureFlag.create({ data: input });
  }

  async getFlag(
    where: Prisma.FeatureFlagWhereUniqueInput,
  ): Promise<FeatureFlag | null> {
    return this.prisma.featureFlag.findUnique({ where });
  }

  async setFlag(
    where: Prisma.FeatureFlagWhereUniqueInput,
    update: Prisma.FeatureFlagUpdateInput,
  ): Promise<FeatureFlag> {
    return this.prisma.featureFlag.update({ where, data: update });
  }

  async deleteFlag(
    where: Prisma.FeatureFlagWhereUniqueInput,
  ): Promise<FeatureFlag> {
    return this.prisma.featureFlag.delete({ where });
  }
}
