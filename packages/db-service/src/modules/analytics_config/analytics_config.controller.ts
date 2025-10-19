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
    console.log('DB Service - Create Analytics Config request:', request);

    try {
      const config =
        await this.analyticsConfigService.createAnalyticsConfig(request);

      console.log('DB Service - Create Analytics Config success:', config);
      return {
        id: config.id,
        environment: config.environment,
        analyticsKey: config.analyticsKey,
      };
    } catch (e) {
      console.error('DB Service - Create Analytics Config error:', e);
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
    console.log('DB Service - Read Analytics Config request:', request);

    try {
      const config =
        await this.analyticsConfigService.readAnalyticsConfig(request);

      console.log('DB Service - Read Analytics Config success:', config);

      if (!config) {
        throw new RpcException({
          code: status.NOT_FOUND,
          message: 'Analytics configuration not found',
        });
      }

      return {
        id: config.id,
        environment: config.environment,
        analyticsKey: config.analyticsKey,
      };
    } catch (error) {
      console.error('DB Service - Read Analytics Config error:', error);
      throw error;
    }
  }

  async updateAnalyticsConfig(
    request: AnalyticsConfigProto.UpdateConfigRequest,
  ): Promise<AnalyticsConfigProto.AnalyticsServiceConfig> {
    //Can only update analyticsKey, is this how it should work?
    const updateData: any = {};
    if (request.analyticsKey !== undefined) {
      updateData.analyticsKey = request.analyticsKey;
    }

    try {
      const config = await this.analyticsConfigService.updateAnalyticsConfig(
        request,
        updateData,
      );

      return {
        id: config.id,
        environment: config.environment,
        analyticsKey: config.analyticsKey,
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
        analyticsKey: config.analyticsKey,
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
