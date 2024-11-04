import { Injectable } from '@nestjs/common';
import { FileServiceConfig } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';
import { ConfigProto } from 'juno-proto';

@Injectable()
export class FileServiceConfigService {
  constructor(private prisma: PrismaService) {}

  async createConfig(
    configData: ConfigProto.CreateFileServiceConfigRequest,
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
            id: configData.id,
          },
        },
        files: {
          create: configData.files?.map(file => ({
            fileId: {
              path: file.fileId.path,
              bucketName: file.fileId.bucketName,
              configId: file.fileId.configId,
            },
            metadata: file.metadata,
          })) || [],
        },
      },
    });
  }

  async getConfig(configId: string): Promise<FileServiceConfig | null> {
    return this.prisma.fileServiceConfig.findUnique({
      where: {
        id: Number(configId),
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
    configData: ConfigProto.UpdateFileServiceConfigRequest,
  ): Promise<FileServiceConfig> {
    return this.prisma.fileServiceConfig.update({
      where: {
        id: Number(configId),
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
            id: configData.id,
          },
        },
        files: {
          deleteMany: {},
          create: configData.files?.map(file => ({
            fileId: {
              path: file.fileId.path,
              bucketName: file.fileId.bucketName,
              configId: file.fileId.configId,
            },
            metadata: file.metadata,
          })) || [],
        },
      },
    });
  }

  async deleteConfig(configId: string): Promise<FileServiceConfig> {
    return this.prisma.fileServiceConfig.delete({
      where: {
        id: Number(configId),
      },
    });
  }
}