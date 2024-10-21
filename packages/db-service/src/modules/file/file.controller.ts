import { Controller } from '@nestjs/common';
import { FileProto } from 'juno-proto';
import { FileService } from './file.service';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { FileDbServiceController } from 'juno-proto/dist/gen/file';
import { Prisma } from '@prisma/client';

@Controller()
@FileProto.FileDbServiceControllerMethods()
export class FileController implements FileDbServiceController {
  constructor(private readonly fileService: FileService) {}

  async createFile(
    request: FileProto.CreateFileRequest,
  ): Promise<FileProto.File> {
    const duplicateFile = await this.fileService.getFile(
      request.bucketName,
      request.configId,
      request.filePath,
    );

    if (duplicateFile) {
      throw new RpcException({
        code: status.ALREADY_EXISTS,
        message: 'File already exists',
      });
    }

    const file = await this.fileService.createFile(
      request.bucketName,
      request.configId,
      request.filePath,
      request.metadata,
    );

    return {
      bucketName: file.bucketName,
      configId: file.configId,
      filePath: file.path,
      metadata: file.metadata,
    };
  }
  async getFile(request: FileProto.GetFileRequest): Promise<FileProto.File> {
    const file = await this.fileService.getFile(
      request.bucketName,
      request.configId,
      request.filePath,
    );

    if (!file) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: 'File not found',
      });
    }

    return {
      bucketName: file.bucketName,
      configId: file.configId,
      filePath: file.path,
      metadata: file.metadata,
    };
  }

  async updateFile(
    request: FileProto.UpdateFileRequest,
  ): Promise<FileProto.File> {
    try {
      const file = await this.fileService.updateFile(
        request.bucketName,
        request.configId,
        request.filePath,
        request.metadata,
      );

      return {
        bucketName: file.bucketName,
        configId: file.configId,
        filePath: file.path,
        metadata: file.metadata,
      };
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2001'
      ) {
        throw new RpcException({
          code: status.NOT_FOUND,
          message: 'File not found',
        });
      }
    }
  }

  async deleteFile(
    request: FileProto.DeleteFileRequest,
  ): Promise<FileProto.File> {
    try {
      const file = await this.fileService.deleteFile(
        request.bucketName,
        request.configId,
        request.filePath,
      );
      return {
        bucketName: file.bucketName,
        configId: file.configId,
        filePath: file.path,
        metadata: file.metadata,
      };
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2001'
      ) {
        throw new RpcException({
          code: status.NOT_FOUND,
          message: 'File not found',
        });
      }
    }
  }
}
