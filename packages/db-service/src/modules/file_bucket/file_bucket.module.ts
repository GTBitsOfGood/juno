import { Module } from '@nestjs/common';
import { FileBucketController } from './file_bucket.controller';
import { FileBucketService } from './file_bucket.service';
import { PrismaService } from 'src/prisma.service';

@Module({
  controllers: [FileBucketController],
  providers: [FileBucketService, PrismaService],
})
export class FileBucketModule {}
