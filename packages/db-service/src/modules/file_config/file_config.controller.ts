import { Controller } from '@nestjs/common';
import { FileServiceConfigService } from './file_config.service';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { FileProto as ConfigProto } from 'juno-proto';
import { FileServiceConfigDbServiceController } from 'juno-proto/dist/gen/file_config';
import { Prisma } from '@prisma/client';

@Controller()
@ConfigProto.FileServiceFileServiceConfigDbServiceControllerMethods()
export class FileConfigController implements FileServiceConfigDbServiceController {
  constructor(private readonly fileServiceConfigService: FileServiceConfigService) {}

  async createConfig(
    request: ConfigProto.CreateFileServiceConfigRequest,
  ): Promise<ConfigProto.FileServiceConfig> {
    const configId = request.config.id;

    const existingConfig = await this.fileServiceConfigService.getConfig(configId);
    if (existingConfig) {
      throw new RpcException({
        code: status.ALREADY_EXISTS,
        message: 'Config already exists',
      });
    }

    const config = await this.fileServiceConfigService.createConfig(request.config);

    return config;
  }

  async getConfig(request: ConfigProto.GetFileServiceConfigRequest): Promise<ConfigProto.FileServiceConfig> {

    const config = await this.fileServiceConfigService.getConfig(request.id);
    if (!config) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: 'Config not found',
      });
    }

    return config;
  }

  async updateConfig(
    request: ConfigProto.UpdateFileServiceConfigRequest,
  ): Promise<ConfigProto.FileServiceConfig> {

    try {
      const config = await this.fileServiceConfigService.updateConfig(
        request.id,
        request.config,
      );

      return config;
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2001') {
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
    request: ConfigProto.DeleteFileServiceConfigRequest,
  ): Promise<ConfigProto.FileServiceConfig> {

    try {
      const config = await this.fileServiceConfigService.deleteConfig(request.id);
      return config;
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2001') {
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