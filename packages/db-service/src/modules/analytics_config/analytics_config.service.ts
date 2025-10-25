import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { Prisma, AnalyticsServiceConfig } from '@prisma/client';
import { AnalyticsConfigProto } from 'juno-proto';

@Injectable()
export class AnalyticsConfigService {
  constructor(private prisma: PrismaService) {}

  async createAnalyticsConfig(
    configData: AnalyticsConfigProto.CreateConfigRequest,
  ): Promise<AnalyticsServiceConfig> {
    return await this.prisma.analyticsServiceConfig.create({
      data: {
        id: Number(configData.projectId),
        environment: configData.environment,
        serverAnalyticsKey: configData.serverAnalyticsKey,
        clientAnalyticsKey: configData.clientAnalyticsKey,
      },
      include: {
        Project: true,
      },
    });
  }

  async readAnalyticsConfig(
    req: AnalyticsConfigProto.ReadConfigRequest,
  ): Promise<AnalyticsServiceConfig | null> {
    return await this.prisma.analyticsServiceConfig.findUnique({
      where: {
        id_environment: {
          id: Number(req.id),
          environment: req.environment,
        },
      },
    });
  }

  async updateAnalyticsConfig(
    req: AnalyticsConfigProto.UpdateConfigRequest,
    data: Prisma.AnalyticsServiceConfigUpdateInput,
  ): Promise<AnalyticsServiceConfig> {
    return await this.prisma.analyticsServiceConfig.update({
      where: {
        id_environment: {
          id: Number(req.id),
          environment: req.environment,
        },
      },
      data,
    });
  }

  async deleteAnalyticsConfig(
    req: AnalyticsConfigProto.DeleteConfigRequest,
  ): Promise<AnalyticsServiceConfig> {
    return await this.prisma.analyticsServiceConfig.delete({
      where: {
        id_environment: {
          id: Number(req.id),
          environment: req.environment,
        },
      },
    });
  }
}
