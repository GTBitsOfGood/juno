import { Injectable } from '@nestjs/common';
import {} from '@prisma/client';
import { FileProviderProto } from 'juno-proto';
import { Bucket } from 'juno-proto/dist/gen/file_bucket';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class FileProviderService {
  constructor(private prisma: PrismaService) {}

  async createProvider(
    req: FileProviderProto.CreateFileProviderRequest,
  ): Promise<FileProviderProto.FileProvider> {
    // const buckets = req.bucket.map((bucket: any, idx: number) => {
    //   // bucket name and configid should be changed once bucket is implemented
    //   return { name: bucket.name, configId: idx };
    // });

    const fileProvider = await this.prisma.fileProvider.create({
      data: {
        accessKey: req.accessKey,
        name: req.providerName,
        metadata: req.metadata,
        // FileServiceBucket: {
        //   create: buckets,
        // },
      },
    });

    return {
      accessKey: fileProvider.accessKey,
      metadata: fileProvider.metadata,
      providerName: fileProvider.name,
      //   will have to fix once buckets are properly updated in proto
      // bucket: buckets as Bucket[],
      bucket: [],
    };
  }

  async getProvider(
    req: FileProviderProto.GetFileProviderRequest,
  ): Promise<FileProviderProto.FileProvider> {
    const fileProvider = await this.prisma.fileProvider.findFirst({
      where: { name: req.providerName },
    });

    return {
      accessKey: fileProvider.accessKey,
      metadata: fileProvider.metadata,
      providerName: fileProvider.name,
      bucket: [],
    };
  }

  async updateProvider(
    req: FileProviderProto.UpdateFileProviderRequest,
  ): Promise<FileProviderProto.FileProvider> {
    // const buckets = req.bucket.map((bucket: any, idx: number) => {
    //   // bucket name and configid should be changed once bucket is implemented
    //   return { name: bucket.name, configId: idx };
    // });

    const fileProvider = await this.prisma.fileProvider.update({
      where: { name: req.providerName },
      data: {
        metadata: req.metadata,
        accessKey: req.accessKey,
        // FileServiceBucket: {
        //   create: buckets,
        // },
      },
    });

    return {
      accessKey: fileProvider.accessKey,
      metadata: fileProvider.metadata,
      providerName: fileProvider.name,
      // bucket: buckets,
      bucket: [],
    };
  }

  async deleteProvider(
    req: FileProviderProto.DeleteFileProviderRequest,
  ): Promise<FileProviderProto.FileProvider> {
    const fileProvider = await this.prisma.fileProvider.delete({
      where: { name: req.providerName },
    });

    return {
      accessKey: fileProvider.accessKey,
      metadata: fileProvider.metadata,
      providerName: fileProvider.name,
      bucket: [],
    };
  }
}
