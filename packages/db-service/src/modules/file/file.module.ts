import { Module } from '@nestjs/common';
import { FileController } from './file.controller';
import { FileService } from './file.service';
import { PrismaService } from 'src/prisma.service';

@Module({
  providers: [FileService, PrismaService],
  controllers: [FileController],
})
export class FileModule {}