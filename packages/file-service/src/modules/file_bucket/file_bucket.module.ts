import { Module } from '@nestjs/common';
import { FileBucketController } from './file_bucket.controller';
import { FileBucketService } from './file_bucket.service';

@Module({
  controllers: [FileBucketController],
  providers: [FileBucketService],
})
export class FileBucketModule {}
