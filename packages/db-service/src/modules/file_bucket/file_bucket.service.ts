import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';
import { FileBucketProto, FileProto, IdentifierProto } from 'juno-proto';
import { Metadata } from '@grpc/grpc-js';
import { FileService } from '../file/file.service';



@Injectable()
export class FileBucketService {
    constructor(private prisma: PrismaService) { }
    async getBucket(request: FileBucketProto.GetBucketRequest): Promise<FileBucketProto.Bucket> | null {
        return convertDbBucket(await this.prisma.fileServiceBucket.findUnique({
            where: {
                name_configId: {
                    name: request.name,
                    configId: request.configId,
                },
            },
            include: {
                FileServiceFile: true,
            }
        }))
    }

    async createBucket(input: FileBucketProto.CreateBucketRequest): Promise<FileBucketProto.Bucket> {
        try {
            return convertDbBucket(this.prisma.fileServiceBucket.create({
                data: {
                    name: input.name,
                    configId: input.configId,
                    fileProviderName: input.fileProviderName,
                    FileServiceFile: {
                        connectOrCreate: input.FileServiceFile.map(file => ({
                            where: {
                                path_bucketName_configId: {
                                    path: file.fileId.path,
                                    bucketName: file.fileId.bucketName,
                                    configId: file.fileId.configId as number,
                                },
                            },
                            create: {
                                path: file.fileId.path,
                                bucketName: file.fileId.bucketName,
                                configId: file.fileId.configId as number,
                                metadata: file.metadata,
                                config: {
                                    connect: { id: file.fileId.configId as number }
                                },
                            },
                        })),
                    },
                    config: {
                        connect: { id: input.configId }
                    },
                    provider: {
                        connect: { name: input.fileProviderName }
                    },
                },
                include: {
                    FileServiceFile: true,
                },
            }))
        } catch (error) {
            console.log(error);
        }
    }

    async updateBucket(request: FileBucketProto.UpdateBucketRequest): Promise<FileBucketProto.Bucket> {

        return convertDbBucket(await this.prisma.fileServiceBucket.update({
            where: {
                name_configId: {
                    name: request.name,
                    configId: request.configId,
                },
            },
            data: {
                fileProviderName: request.fileProviderName
            },
            include: {
                FileServiceFile: true,
            },
        }));
    }

    async deleteBucket(request: FileBucketProto.DeleteBucketRequest): Promise<FileBucketProto.Bucket> {

        return convertDbBucket(await this.prisma.fileServiceBucket.delete({
            where: {
                name_configId: {
                    name: request.name,
                    configId: request.configId,
                },
            },
            include: {
                FileServiceFile: true,
            }
        }));
    }
}

const convertDbBucket = (bucket: any): FileBucketProto.Bucket => {
    const mappedFiles: IdentifierProto.FileIdentifier[] = bucket.FileServiceFile.map((file) => ({
        fileId: {
            path: file.path,
            configId: file.configId,
            bucketName: file.bucketName
        } as IdentifierProto.FileIdentifier,
    }));

    const res: FileBucketProto.Bucket = {
        name: bucket.name,
        configId: bucket.configId,
        fileProviderName: bucket.fileProviderName,
        FileServiceFile: mappedFiles
    };
    return res;
};