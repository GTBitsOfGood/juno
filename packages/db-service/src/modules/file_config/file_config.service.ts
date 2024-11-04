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
      },
      include: {
        Project: true,
        buckets: true,
        FileServiceFile: true,
      },
    });
  }

  async getConfig(configId: number): Promise<FileServiceConfig | null> {
    return this.prisma.fileServiceConfig.findUnique({
      where: {
        id: Number(configId),
      },
      include: {
        Project: true,
        buckets: true,
        FileServiceFile: true,
      },
    });
  }

  async updateConfig(
    configId: number,
    configData: FileConfigProto.UpdateFileServiceConfigRequest,
  ): Promise<FileServiceConfig> {
    return this.prisma.fileServiceConfig.update({
      where: {
        id: Number(configId),
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
            id: Number(configData.id),
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

  async deleteConfig(configId: number): Promise<FileServiceConfig> {
    return this.prisma.fileServiceConfig.delete({
      where: {
        id: Number(configId),
      },
      include: {
        Project: true,
        buckets: true,
        FileServiceFile: true,
      },
    });
  }
}
