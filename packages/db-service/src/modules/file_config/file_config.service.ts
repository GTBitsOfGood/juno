import { Injectable } from '@nestjs/common';
import { FileServiceConfig } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';
import { ConfigProto } from 'juno-proto';

@Injectable()
export class FileServiceConfigService {
  constructor(private prisma: PrismaService) {}

  async createConfig(
    configData: ConfigProto.FileServiceConfig,
  ): Promise<FileServiceConfig> {
    return this.prisma.fileServiceConfig.create({
      data: {
        id: configData.id,
        buckets: {
          create: configData.buckets.map(bucket => ({
            bucketName: bucket.bucketName,
          })),
        },
        project: {
          connect: {
            id: configData.project.id,
          },
        },
        files: {
          create: configData.files.map(file => ({
            fileId: {
              path: file.fileId.path,
              bucketName: file.fileId.bucketName,
              configId: file.fileId.configId,
            },
            metadata: file.metadata,
          })),
        },
      },
    });
  }

  async getConfig(configId: string): Promise<FileServiceConfig> {
    return this.prisma.fileServiceConfig.findUnique({
      where: {
        id: configId,
      },
      include: {
        buckets: true,
        project: true,
        files: true,
      },
    });
  }

  async updateConfig(
    configId: string,
    configData: ConfigProto.FileServiceConfig,
  ): Promise<FileServiceConfig> {
    return this.prisma.fileServiceConfig.update({
      where: {
        id: configId,
      },
      data: {
        buckets: {
          deleteMany: {},
          create: configData.buckets.map(bucket => ({
            bucketName: bucket.bucketName,
          })),
        },
        project: {
          connect: {
            id: configData.project.id,
          },
        },
        files: {
          deleteMany: {},
          create: configData.files.map(file => ({
            fileId: {
              path: file.fileId.path,
              bucketName: file.fileId.bucketName,
              configId: file.fileId.configId,
            },
            metadata: file.metadata,
          })),
        },
      },
    });
  }

  async deleteConfig(configId: string): Promise<FileServiceConfig> {
    return this.prisma.fileServiceConfig.delete({
      where: {
        id: configId,
      },
    });
  }

  get rawPrisma() {
    return this.prisma;
  }
}
