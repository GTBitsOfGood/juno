import { Injectable } from '@nestjs/common';
import { FileProviderType } from '@prisma/client';
import { FileProviderProto } from 'juno-proto';
// import { Bucket } from 'juno-proto/dist/gen/file_bucket';
import { PrismaService } from 'src/prisma.service';

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

  async createProvider(
    req: FileProviderProto.CreateFileProviderRequest,
  ): Promise<FileProviderProto.FileProvider> {
    try {
      // const buckets = req.bucket.map((bucket: any, idx: number) => {
      //   // bucket name and configid should be changed once bucket is implemented
      //   return { name: bucket.name, configId: idx };
      // });

      const fileProvider = await this.prisma.fileProvider.create({
        data: {
          accessKey: req.accessKey,
          name: req.providerName,
          metadata: req.metadata,
          type: this.rpcToPrismaProvider(req.type),
          // FileServiceBucket: {
          //   create: buckets,
          // },
        },
      });

      return {
        metadata: fileProvider.metadata,
        providerName: fileProvider.name,
        accessKey: fileProvider.accessKey,
        providerType: req.type,
        //   will have to fix once buckets are properly updated in proto
        // bucket: buckets as Bucket[],
        bucket: [],
      };
    } catch (error) {
      console.error('Error creating file provider:', error);
      throw error;
    }
  }

  async getProvider(
    req: FileProviderProto.GetFileProviderRequest,
  ): Promise<FileProviderProto.FileProvider> {
    try {
      const fileProvider = await this.prisma.fileProvider.findFirst({
        where: { name: req.providerName },
      });

      return {
        metadata: fileProvider.metadata,
        providerName: fileProvider.name,
        providerType: this.prismaToRpcProvider(fileProvider.type),
        bucket: [],
        accessKey: fileProvider.accessKey,
      };
    } catch (error) {
      console.error('Error getting file provider:', error);
      throw error;
    }
  }

  async updateProvider(
    req: FileProviderProto.UpdateFileProviderRequest,
  ): Promise<FileProviderProto.FileProvider> {
    try {
      // const buckets = req.bucket.map((bucket: any, idx: number) => {
      //   // bucket name and configid should be changed once bucket is implemented
      //   return { name: bucket.name, configId: idx };
      // });
      const newData = {};
      for (const key of Object.keys(req)) {
        if (req[key] && key !== 'providerName') {
          newData[key] = req[key];
        }
      }
      // const fileProvider = await this.prisma.fileProvider.update({
      //   where: { name: req.providerName },
      //   data: {
      //     metadata: req.metadata,
      //     p: req.accessKey,
      //     // FileServiceBucket: {
      //     //   create: buckets,
      //     // },
      //   },
      // });
      const fileProvider = await this.prisma.fileProvider.update({
        where: { name: req.providerName },
        data: newData,
      });

      return {
        metadata: fileProvider.metadata,
        providerName: fileProvider.name,
        accessKey: fileProvider.accessKey,
        providerType: fileProvider.type
          ? this.prismaToRpcProvider(fileProvider.type)
          : undefined,
        // bucket: buckets,
        bucket: [],
      };
    } catch (error) {
      console.error('Error updating file provider:', error);
      throw error;
    }
  }

  async deleteProvider(
    req: FileProviderProto.DeleteFileProviderRequest,
  ): Promise<FileProviderProto.FileProvider> {
    try {
      const fileProvider = await this.prisma.fileProvider.delete({
        where: { name: req.providerName },
      });

      return {
        metadata: fileProvider.metadata,
        providerName: fileProvider.name,
        accessKey: fileProvider.accessKey,
        providerType: this.prismaToRpcProvider(fileProvider.type),
        bucket: [],
      };
    } catch (error) {
      console.error('Error deleting file provider:', error);
      throw error;
    }
  }
}
