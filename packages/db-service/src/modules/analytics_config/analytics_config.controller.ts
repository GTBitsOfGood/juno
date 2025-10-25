import { status } from '@grpc/grpc-js';
import { Controller } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Prisma } from '@prisma/client';
import { AnalyticsConfigProto } from 'juno-proto';
import { AnalyticsConfigService } from './analytics_config.service';

@Controller()
@AnalyticsConfigProto.AnalyticsConfigDbServiceControllerMethods()
export class AnalyticsConfigDbController
  implements AnalyticsConfigProto.AnalyticsConfigDbServiceController
{
  constructor(
    private readonly analyticsConfigService: AnalyticsConfigService,
  ) {}

  async createAnalyticsConfig(
    request: AnalyticsConfigProto.CreateConfigRequest,
  ): Promise<AnalyticsConfigProto.AnalyticsServiceConfig> {
    try {
      const config =
        await this.analyticsConfigService.createAnalyticsConfig(request);

      return {
        id: config.id,
        environment: config.environment,
        serverAnalyticsKey: config.serverAnalyticsKey,
        clientAnalyticsKey: config.clientAnalyticsKey,
      };
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new RpcException({
          code: status.ALREADY_EXISTS,
          message: 'Analytics configuration already exists',
        });
      }
      throw new RpcException({
        code: status.FAILED_PRECONDITION,
        message: 'Failed to create analytics configuration',
      });
    }
  }

  async readAnalyticsConfig(
    request: AnalyticsConfigProto.ReadConfigRequest,
  ): Promise<AnalyticsConfigProto.AnalyticsServiceConfig> {
    try {
      const config =
        await this.analyticsConfigService.readAnalyticsConfig(request);

      if (!config) {
        throw new RpcException({
          code: status.NOT_FOUND,
          message: 'Analytics configuration not found',
        });
      }

      return {
        id: config.id,
        environment: config.environment,
        serverAnalyticsKey: config.serverAnalyticsKey,
        clientAnalyticsKey: config.clientAnalyticsKey,
      };
    } catch (error) {
      throw error;
    }
  }

  async updateAnalyticsConfig(
    request: AnalyticsConfigProto.UpdateConfigRequest,
  ): Promise<AnalyticsConfigProto.AnalyticsServiceConfig> {
    const updateData: any = {};
    if (request.serverAnalyticsKey !== undefined) {
      updateData.serverAnalyticsKey = request.serverAnalyticsKey;
    }

    if (request.clientAnalyticsKey !== undefined) {
      updateData.clientAnalyticsKey = request.clientAnalyticsKey;
    }

    try {
      const config = await this.analyticsConfigService.updateAnalyticsConfig(
        request,
        updateData,
      );

      return {
        id: config.id,
        environment: config.environment,
        serverAnalyticsKey: config.serverAnalyticsKey,
        clientAnalyticsKey: config.clientAnalyticsKey,
      };
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2025'
      ) {
        throw new RpcException({
          code: status.NOT_FOUND,
          message: 'Analytics configuration not found',
        });
      }
      throw new RpcException({
        code: status.FAILED_PRECONDITION,
        message: 'Failed to update analytics configuration',
      });
    }
  }

  async deleteAnalyticsConfig(
    request: AnalyticsConfigProto.DeleteConfigRequest,
  ): Promise<AnalyticsConfigProto.AnalyticsServiceConfig> {
    try {
      const config =
        await this.analyticsConfigService.deleteAnalyticsConfig(request);

      return {
        id: config.id,
        environment: config.environment,
        clientAnalyticsKey: config.clientAnalyticsKey,
        serverAnalyticsKey: config.serverAnalyticsKey,
      };
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2025'
      ) {
        throw new RpcException({
          code: status.NOT_FOUND,
          message: 'Analytics configuration not found',
        });
      }
      throw new RpcException({
        code: status.FAILED_PRECONDITION,
        message: 'Failed to delete analytics configuration',
      });
    }
  }
}
