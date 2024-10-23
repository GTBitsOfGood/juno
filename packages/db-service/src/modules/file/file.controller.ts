import { Controller } from '@nestjs/common';
import { FileProto } from 'juno-proto';
import { FileService } from './file.service';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { FileDbServiceController } from 'juno-proto/dist/gen/file';
import { Prisma } from '@prisma/client';
import { validateFileId } from 'src/utility/validate';

@Controller()
@FileProto.FileDbServiceControllerMethods()
export class FileController implements FileDbServiceController {
  constructor(private readonly fileService: FileService) {}

  async createFile(
    request: FileProto.CreateFileRequest,
  ): Promise<FileProto.File> {
    validateFileId(request.fileId);

    const duplicateFile = await this.fileService.getFile(request.fileId);

    if (duplicateFile) {
      throw new RpcException({
        code: status.ALREADY_EXISTS,
        message: 'File already exists',
      });
    }

    const file = await this.fileService.createFile(
      request.fileId,
      request.metadata,
    );

    return {
      fileId: {
        bucketName: file.bucketName,
        configId: file.configId,
        path: file.path,
      },
      metadata: file.metadata,
    };
  }
  async getFile(request: FileProto.GetFileRequest): Promise<FileProto.File> {
    validateFileId(request.fileId);

    const file = await this.fileService.getFile(request.fileId);

    if (!file) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: 'File not found',
      });
    }

    return {
      fileId: {
        bucketName: file.bucketName,
        configId: file.configId,
        path: file.path,
      },
      metadata: file.metadata,
    };
  }

  async updateFile(
    request: FileProto.UpdateFileRequest,
  ): Promise<FileProto.File> {
    validateFileId(request.fileId);

    try {
      const file = await this.fileService.updateFile(
        request.fileId,
        request.metadata,
      );

      return {
        fileId: {
          bucketName: file.bucketName,
          configId: file.configId,
          path: file.path,
        },
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
    validateFileId(request.fileId);

    try {
      const file = await this.fileService.deleteFile(request.fileId);
      return {
        fileId: {
          bucketName: file.bucketName,
          configId: file.configId,
          path: file.path,
        },
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
