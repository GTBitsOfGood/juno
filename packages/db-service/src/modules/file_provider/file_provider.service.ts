import { status } from '@grpc/grpc-js';
import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { FileProvider, FileProviderType } from '@prisma/client';
import { FileProviderProto } from 'juno-proto';

import { PrismaService } from 'src/prisma.service';

type ConfigScope = { configId: number; configEnv: string };

@Injectable()
export class FileProviderService {
  constructor(private prisma: PrismaService) {}

  rpcToPrismaProvider(req: FileProviderProto.ProviderType): FileProviderType {
    switch (req) {
      case FileProviderProto.ProviderType.S3:
        return 'S3';
      case FileProviderProto.ProviderType.AZURE:
        return 'AZURE';
    }
  }

  prismaToRpcProvider(req: FileProviderType): FileProviderProto.ProviderType {
    switch (req) {
      case 'S3':
        return FileProviderProto.ProviderType.S3;
      case 'AZURE':
        return FileProviderProto.ProviderType.AZURE;
    }
  }

  toRpc(provider: FileProvider): FileProviderProto.FileProvider {
    return {
      id: provider.id,
      providerName: provider.name,
      accessKey: provider.accessKey,
      metadata: provider.metadata,
      providerType: this.prismaToRpcProvider(provider.type),
      configId: provider.configId ?? undefined,
      configEnv: provider.configEnv ?? undefined,
      bucket: [],
    };
  }

  private uniqueWhere(providerName: string, scope: ConfigScope) {
    return {
      name_configId_configEnv: {
        name: providerName,
        configId: Number(scope.configId),
        configEnv: scope.configEnv,
      },
    };
  }

  async createProvider(
    req: FileProviderProto.CreateFileProviderRequest,
  ): Promise<FileProviderProto.FileProvider> {
    try {
      const fileProvider = await this.prisma.fileProvider.upsert({
        where: this.uniqueWhere(req.providerName, req),
        create: {
          name: req.providerName,
          accessKey: req.accessKey,
          metadata: req.metadata,
          type: this.rpcToPrismaProvider(req.type),
          configId: Number(req.configId),
          configEnv: req.configEnv,
        },
        update: {
          accessKey: req.accessKey,
          metadata: req.metadata,
          type: this.rpcToPrismaProvider(req.type),
        },
      });
      return this.toRpc(fileProvider);
    } catch (error) {
      throw new RpcException({
        code: status.FAILED_PRECONDITION,
        // P2003: foreign key violation, i.e. the file config does not exist.
        message:
          error?.code === 'P2003'
            ? 'File config does not exist; set up file services for this project first'
            : 'Failed to create file provider',
      });
    }
  }

  async getProvider(
    req: FileProviderProto.GetFileProviderRequest,
  ): Promise<FileProviderProto.FileProvider> {
    const fileProvider = await this.prisma.fileProvider.findUnique({
      where: this.uniqueWhere(req.providerName, req),
    });
    if (!fileProvider) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: 'File provider not found',
      });
    }
    return this.toRpc(fileProvider);
  }

  async getAllProviders(): Promise<FileProviderProto.FileProviders> {
    const fileProviders = await this.prisma.fileProvider.findMany({
      orderBy: { id: 'asc' },
    });
    return { providers: fileProviders.map((p) => this.toRpc(p)) };
  }

  async getProvidersByConfigId(
    req: FileProviderProto.GetFileProvidersByConfigIdRequest,
  ): Promise<FileProviderProto.FileProviders> {
    const fileProviders = await this.prisma.fileProvider.findMany({
      where: { configId: Number(req.configId), configEnv: req.configEnv },
      orderBy: { id: 'asc' },
    });
    return { providers: fileProviders.map((p) => this.toRpc(p)) };
  }

  async updateProvider(
    req: FileProviderProto.UpdateFileProviderRequest,
  ): Promise<FileProviderProto.FileProvider> {
    try {
      const fileProvider = await this.prisma.fileProvider.update({
        where: this.uniqueWhere(req.providerName, req),
        data: {
          accessKey: req.accessKey || undefined,
          metadata: req.metadata || undefined,
          type:
            req.type !== undefined
              ? this.rpcToPrismaProvider(req.type)
              : undefined,
        },
      });
      return this.toRpc(fileProvider);
    } catch (error) {
      throw new RpcException({
        code: status.FAILED_PRECONDITION,
        message: 'Failed to update file provider',
      });
    }
  }

  async deleteProvider(
    req: FileProviderProto.DeleteFileProviderRequest,
  ): Promise<FileProviderProto.FileProvider> {
    try {
      const fileProvider = await this.prisma.fileProvider.delete({
        where: this.uniqueWhere(req.providerName, req),
      });
      return this.toRpc(fileProvider);
    } catch (error) {
      throw new RpcException({
        code: status.FAILED_PRECONDITION,
        message: 'Failed to delete file provider',
      });
    }
  }
}
