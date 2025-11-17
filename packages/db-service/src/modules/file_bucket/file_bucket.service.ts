import { Injectable } from '@nestjs/common';
import { FileBucketProto, IdentifierProto } from 'juno-proto';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class FileBucketService {
  constructor(private prisma: PrismaService) {}
  async getBucket(
    request: FileBucketProto.GetBucketRequest,
  ): Promise<FileBucketProto.Bucket> | null {
    return convertDbBucket(
      await this.prisma.fileServiceBucket.findUnique({
        where: {
          name_configId_configEnv: {
            name: request.name,
            configId: request.configId,
            configEnv: request.configEnv,
          },
        },
        include: {
          FileServiceFile: true,
        },
      }),
    );
  }

  async getBucketsByConfigIdAndEnv(
    request: FileBucketProto.GetBucketsByConfigIdAndEnvRequest,
  ): Promise<FileBucketProto.Bucket[]> {
    const buckets = await this.prisma.fileServiceBucket.findMany({
      where: {
        configId: request.configId,
        configEnv: request.configEnv,
      },
      include: {
        FileServiceFile: true,
      },
    });
    return buckets.map((bucket: any) => convertDbBucket(bucket));
  }

  async createBucket(input: FileBucketProto.CreateBucketRequest) {
    const { name, fileProviderName, configId } = input;
    return await this.prisma.fileServiceBucket.create({
      data: {
        name,
        fileProviderName,
        configId: Number(configId),
        configEnv: input.configEnv,
        //add fileservicefile after having access to files
      },
    });
  }

  async updateBucket(
    request: FileBucketProto.UpdateBucketRequest,
  ): Promise<FileBucketProto.Bucket> {
    return convertDbBucket(
      await this.prisma.fileServiceBucket.update({
        where: {
          name_configId_configEnv: {
            name: request.name,
            configId: Number(request.configId),
            configEnv: request.configEnv,
          },
        },
        data: {
          fileProviderName: request.fileProviderName,
        },
        include: {
          FileServiceFile: true,
        },
      }),
    );
  }

  async deleteBucket(
    request: FileBucketProto.DeleteBucketRequest,
  ): Promise<FileBucketProto.Bucket> {
    return convertDbBucket(
      await this.prisma.fileServiceBucket.delete({
        where: {
          name_configId_configEnv: {
            name: request.name,
            configId: Number(request.configId),
            configEnv: request.configEnv,
          },
        },
        include: {
          FileServiceFile: true,
        },
      }),
    );
  }
}

const convertDbBucket = (bucket: any): FileBucketProto.Bucket => {
  const mappedFiles: IdentifierProto.FileIdentifier[] =
    bucket.FileServiceFile.map((file) => ({
      fileId: {
        path: file.path,
        configId: file.configId,
        bucketName: file.bucketName,
        configEnv: file.configEnv,
      } as IdentifierProto.FileIdentifier,
    }));

  const res: FileBucketProto.Bucket = {
    name: bucket.name,
    configId: bucket.configId,
    configEnv: bucket.configEnv,
    fileProviderName: bucket.fileProviderName,
    FileServiceFile: mappedFiles,
  };
  return res;
};
