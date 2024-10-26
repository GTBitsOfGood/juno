import { Injectable } from '@nestjs/common';
import { Prisma, FileBucket } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';
import { FileBucketProto } from 'juno-proto';



@Injectable()
export class FileBucketService {
    constructor(private prisma: PrismaService) { }
    async getBucket(request: FileBucketProto.GetFileBucketRequest): Promise<FileBucketProto.FileBucket> | null {
        return await this.prisma.fileServiceBucket.findUnique({
            where: {
                name_configId: {
                    name: request.name,
                    configId: request.configId,
                },
            },
        })
    }
    async createBucket(input: FileBucketProto.CreateFileBucketRequest): Promise<FileBucketProto.FileBucket> {
        return await this.prisma.fileServiceBucket.create({
            data: {
                name: input.name,
                configId: input.configId,
                fileProviderName: input.filedProviderName,
                FileServiceFile: {
                    create: input.files.map(file => ({ ...file }))
                },
            },
            config: {
                connect: { id: input.configId }
            },
            provider: {
                connect: { name: input.filedProviderName }
            }
        })
    }

    async updateBucket(request: FileBucketProto.UpdateFileBucketRequest): Promise<FileBucketProto.FileBucket> {

        return await this.prisma.fileServiceBucket.delete({
            where: {
                name_configId: {
                    name: request.name,
                    configId: request.configId,
                },
            },
            data: {
                //nothing to update 
            }
        });
    }

    async deleteBucket(request: FileBucketProto.DeleteFileBucketRequest): Promise<FileBucketProto.FileBucket> {

        return await this.prisma.fileServiceBucket.delete({
            where: {
                name_configId: {
                    name: request.name,
                    configId: request.configId,
                },
            }
        });
    }
}
