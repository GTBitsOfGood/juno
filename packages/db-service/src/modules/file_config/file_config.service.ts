import { Injectable } from '@nestjs/common';
import { FileServiceConfig } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';
import { FileConfigProto } from 'juno-proto';

@Injectable()
export class FileServiceConfigService {
  constructor(private prisma: PrismaService) {}

  async createConfig(
    configData: FileConfigProto.CreateFileServiceConfigRequest,
  ): Promise<FileServiceConfig> {
    return this.prisma.fileServiceConfig.create({
      data: {
        Project: {
          connect: {
            id: Number(configData.projectId),
          },
        },
        environment: configData.environment,
      },
      include: {
        Project: true,
        buckets: true,
        FileServiceFile: true,
      },
    });
  }

  async getConfig(
    req: FileConfigProto.GetFileServiceConfigRequest,
  ): Promise<FileServiceConfig | null> {
    return this.prisma.fileServiceConfig.findUnique({
      where: {
        id_environment: {
          id: Number(req.id),
          environment: req.environment,
        },
      },
      include: {
        Project: true,
        buckets: true,
        FileServiceFile: true,
      },
    });
  }

  async updateConfig(
    req: FileConfigProto.UpdateFileServiceConfigRequest,
  ): Promise<FileServiceConfig> {
    return this.prisma.fileServiceConfig.update({
      where: {
        id_environment: {
          id: Number(req.id),
          environment: req.environment,
        },
      },
      data: {
        buckets: {
          deleteMany: {},
          // create: configData.buckets.map((bucket) => ({
          //   bucketName: bucket.bucketName,
          // })),
        },
        Project: {
          connect: {
            id: Number(req.id),
          },
        },
        FileServiceFile: {
          deleteMany: {},
          // create:
          //   configData.files?.map((file) => ({
          //     fileId: {
          //       path: file.fileId.path,
          //       bucketName: file.fileId.bucketName,
          //       configId: file.fileId.configId,
          //     },
          //     metadata: file.metadata,
          //   })) || [],
        },
      },
      include: {
        Project: true,
        buckets: true,
        FileServiceFile: true,
      },
    });
  }

  async deleteConfig(
    request: FileConfigProto.DeleteFileServiceConfigRequest,
  ): Promise<FileServiceConfig> {
    return this.prisma.fileServiceConfig.delete({
      where: {
        id_environment: {
          id: Number(request.id),
          environment: request.environment,
        },
      },
      include: {
        Project: true,
        buckets: true,
        FileServiceFile: true,
      },
    });
  }
}
