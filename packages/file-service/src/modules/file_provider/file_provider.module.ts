import { Module } from '@nestjs/common';
import { FileProviderController } from './file_provider.controller';

@Module({
  controllers: [FileProviderController],
})
export class FileProviderModule {}
