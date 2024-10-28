import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';
import { FileBucketProto, IdentifierProto } from 'juno-proto';

@Injectable()
export class FileBucketService {
    constructor(private prisma: PrismaService) { }
    async getBucket(
        request: FileBucketProto.GetBucketRequest,
    ): Promise<FileBucketProto.Bucket> | null {
        return convertDbBucket(
            await this.prisma.fileServiceBucket.findUnique({
                where: {
                    name_configId: {
                        name: request.name,
                        configId: request.configId,
                    },
                },
                include: {
                    FileServiceFile: true,
                },
            }),
        );
    }
    async createBucket(
        input: FileBucketProto.CreateBucketRequest,
    ) {
            const { name, fileProviderName, configId, FileServiceFile } = input
            return await this.prisma.fileServiceBucket.create({
                data: {
                    name,
                    fileProviderName,
                    configId,
                    //add fileservicefile after having access to files
                    
                }
            });
    }

    async updateBucket(
        request: FileBucketProto.UpdateBucketRequest,
    ): Promise<FileBucketProto.Bucket> {
        return convertDbBucket(
            await this.prisma.fileServiceBucket.update({
                where: {
                    name_configId: {
                        name: request.name,
                        configId: request.configId,
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
                    name_configId: {
                        name: request.name,
                        configId: request.configId,
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
            } as IdentifierProto.FileIdentifier,
        }));

    const res: FileBucketProto.Bucket = {
        name: bucket.name,
        configId: bucket.configId,
        fileProviderName: bucket.fileProviderName,
        FileServiceFile: mappedFiles,
    };
    return res;
};
