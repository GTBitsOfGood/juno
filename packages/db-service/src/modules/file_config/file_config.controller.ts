import { status } from '@grpc/grpc-js';
import { Controller } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Prisma } from '@prisma/client';
import { FileBucketProto, FileConfigProto, FileProto } from 'juno-proto';
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

    // TODO: find a way to hook this up with the standard proto definitions
    type PrismaConfigWithRelations = {
      id: number;
      environment: string;
      FileServiceFile: Array<{
        path: string;
        bucketName: string;
        configId: number;
        configEnv: string;
        metadata: string;
      }>;
      buckets: Array<{
        name: string;
        configId: number;
        configEnv: string;
        fileProviderName: string;
      }>;
    };

    const prismaConfig = config as unknown as PrismaConfigWithRelations;

    const files: FileProto.File[] = (prismaConfig.FileServiceFile ?? []).map(
      (f) => ({
        fileId: {
          path: f.path,
          bucketName: f.bucketName,
          configId: f.configId,
          configEnv: f.configEnv,
        },
        metadata: f.metadata,
      }),
    );

    const buckets: FileBucketProto.Bucket[] = (prismaConfig.buckets ?? []).map(
      (b) => ({
        name: b.name,
        configId: b.configId,
        configEnv: b.configEnv,
        fileProviderName: b.fileProviderName,
        FileServiceFile: (prismaConfig.FileServiceFile ?? [])
          .filter(
            (f) =>
              f.bucketName === b.name &&
              f.configId === b.configId &&
              f.configEnv === b.configEnv,
          )
          .map((f) => ({
            path: f.path,
            bucketName: f.bucketName,
            configId: f.configId,
            configEnv: f.configEnv,
          })),
      }),
    );

    return {
      id: config.id,
      environment: config.environment,
      files,
      buckets,
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
