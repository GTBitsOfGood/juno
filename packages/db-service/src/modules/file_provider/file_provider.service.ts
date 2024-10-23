import { Injectable } from '@nestjs/common';
import { FileProviderProto } from 'juno-proto';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class FileProviderService {
  constructor(private prisma: PrismaService) {}

  async createProvider(
    req: FileProviderProto.CreateFileProviderRequest,
  ): Promise<FileProviderProto.FileProvider> {}

  async getProvider(
    req: FileProviderProto.GetFileProviderRequest,
  ): Promise<FileProviderProto.FileProvider> {}

  async updateProvider(
    req: FileProviderProto.UpdateFileProviderRequest,
  ): Promise<FileProviderProto.FileProvider> {}

  async deleteProvider(
    req: FileProviderProto.DeleteFileProviderRequest,
  ): Promise<FileProviderProto.FileProvider> {}
}
