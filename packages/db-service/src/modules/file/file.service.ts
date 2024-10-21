import { Injectable } from '@nestjs/common';
import { FileServiceFile } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class FileService {
  constructor(private prisma: PrismaService) {}

  async createFile(
    bucketName: string,
    configId: number,
    filePath: string,
    metadata: string,
  ): Promise<FileServiceFile> {
    return this.prisma.fileServiceFile.create({
      data: {
        path: filePath,
        configId: configId,
        bucketName: bucketName,
        metadata: metadata,
      },
    });
  }

  async getFile(
    bucketName: string,
    configId: number,
    filePath: string,
  ): Promise<FileServiceFile> {
    return this.prisma.fileServiceFile.findUnique({
      where: {
        path_bucketName_configId: {
          path: filePath,
          bucketName: bucketName,
          configId: configId,
        },
      },
    });
  }

  async updateFile(
    bucketName: string,
    configId: number,
    filePath: string,
    metadata: string,
  ): Promise<FileServiceFile> {
    return this.prisma.fileServiceFile.update({
      where: {
        path_bucketName_configId: {
          path: filePath,
          bucketName: bucketName,
          configId: configId,
        },
      },
      data: {
        metadata: metadata,
      },
    });
  }

  async deleteFile(
    bucketName: string,
    configId: number,
    filePath: string,
  ): Promise<FileServiceFile> {
    return await this.prisma.fileServiceFile.delete({
      where: {
        path_bucketName_configId: {
          path: filePath,
          bucketName: bucketName,
          configId: configId,
        },
      },
    });
  }

  get rawPrisma() {
    return this.prisma;
  }
}
