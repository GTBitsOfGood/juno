import { Controller } from '@nestjs/common';
import { FileServiceConfigService } from './file_config.service';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { FileConfigProto } from 'juno-proto';
import { Prisma } from '@prisma/client';

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
    const configId = request.projectId;

    try {
      const existingConfig =
        await this.fileServiceConfigService.getConfig(configId);
      if (existingConfig) {
        throw new RpcException({
          code: status.ALREADY_EXISTS,
          message: 'Config already exists',
        });
      }
    } catch (error) {
      throw new RpcException({
        code: status.ALREADY_EXISTS,
        message: 'Config already exists',
      });
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
    const config = await this.fileServiceConfigService.getConfig(request.id);
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
        code: status.UNKNOWN,
        message: 'An unknown error occurred during update',
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
        code: status.UNKNOWN,
        message: 'An unknown error occurred during deletion',
      });
    }
  }
}
