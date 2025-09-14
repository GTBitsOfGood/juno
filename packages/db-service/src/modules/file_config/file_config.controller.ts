import { status } from '@grpc/grpc-js';
import { Controller } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Prisma } from '@prisma/client';
import { FileConfigProto } from 'juno-proto';
import { FileServiceConfigService } from './file_config.service';

@Controller()
@FileConfigProto.FileServiceConfigDbServiceControllerMethods()
export class FileConfigController
  implements FileConfigProto.FileServiceConfigDbServiceController
{
  constructor(
    private readonly fileServiceConfigService: FileServiceConfigService,
  ) {}

  async createConfig(
    request: FileConfigProto.CreateFileServiceConfigRequest,
  ): Promise<FileConfigProto.FileServiceConfig> {
    const projectId = request.projectId;
    const environment = request.environment;

    try {
      const existingConfig = await this.fileServiceConfigService.getConfig({
        id: projectId,
        environment,
      });
      if (existingConfig) {
        return {
          id: existingConfig.id,
          environment: existingConfig.environment,
          files: [],
          buckets: [],
        };
      }
    } catch {
      // Intentionally ignoring getConfig error for now
    }

    const config = await this.fileServiceConfigService.createConfig(request);

    return {
      id: config.id,
      environment: config.environment,
      files: [],
      buckets: [],
    };
  }

  async getConfig(
    request: FileConfigProto.GetFileServiceConfigRequest,
  ): Promise<FileConfigProto.FileServiceConfig> {
    const config = await this.fileServiceConfigService.getConfig({
      id: request.id,
      environment: request.environment,
    });
    if (!config) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: 'Config not found',
      });
    }

    return {
      id: config.id,
      environment: config.environment,
      files: [],
      buckets: [],
    };
  }

  async updateConfig(
    request: FileConfigProto.UpdateFileServiceConfigRequest,
  ): Promise<FileConfigProto.FileServiceConfig> {
    try {
      const config = await this.fileServiceConfigService.updateConfig(request);

      return {
        id: config.id,
        environment: config.environment,
        files: [],
        buckets: [],
      };
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2001'
      ) {
        throw new RpcException({
          code: status.NOT_FOUND,
          message: 'Config not found',
        });
      }
      throw new RpcException({
        code: status.FAILED_PRECONDITION,
        message: 'Failed to update config',
      });
    }
  }

  async deleteConfig(
    request: FileConfigProto.DeleteFileServiceConfigRequest,
  ): Promise<FileConfigProto.FileServiceConfig> {
    try {
      const config = await this.fileServiceConfigService.deleteConfig(request);
      return {
        id: config.id,
        environment: config.environment,
        files: [],
        buckets: [],
      };
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2001'
      ) {
        throw new RpcException({
          code: status.NOT_FOUND,
          message: 'Config not found',
        });
      }
      throw new RpcException({
        code: status.FAILED_PRECONDITION,
        message: 'Failed to delete config',
      });
    }
  }
}
