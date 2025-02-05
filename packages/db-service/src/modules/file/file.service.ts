import { Injectable } from '@nestjs/common';
import { FileServiceFile } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';
import { IdentifierProto } from 'juno-proto';

@Injectable()
export class FileService {
  constructor(private prisma: PrismaService) {}

  async createFile(
    fileId: IdentifierProto.FileIdentifier,
    metadata: string,
  ): Promise<FileServiceFile> {
    return this.prisma.fileServiceFile.create({
      data: {
        ...fileId,
        metadata: metadata,
      },
    });
  }

  async getFile(
    fileId: IdentifierProto.FileIdentifier,
  ): Promise<FileServiceFile> {
    return this.prisma.fileServiceFile.findUnique({
      where: {
        path_bucketName_configId_configEnv: {
          ...fileId,
        },
      },
    });
  }

  async updateFile(
    fileId: IdentifierProto.FileIdentifier,
    metadata: string,
  ): Promise<FileServiceFile> {
    return this.prisma.fileServiceFile.update({
      where: {
        path_bucketName_configId_configEnv: {
          ...fileId,
        },
      },
      data: {
        metadata: metadata,
      },
    });
  }

  async deleteFile(
    fileId: IdentifierProto.FileIdentifier,
  ): Promise<FileServiceFile> {
    return await this.prisma.fileServiceFile.delete({
      where: {
        path_bucketName_configId_configEnv: {
          ...fileId,
        },
      },
    });
  }

  get rawPrisma() {
    return this.prisma;
  }
}
