import { Module } from '@nestjs/common';
import { FileProviderController } from './file_provider.controller';
import { FileProviderService } from './file_provider.service';
import { PrismaService } from 'src/prisma.service';

@Module({
  providers: [FileProviderService, PrismaService],
  controllers: [FileProviderController],
})
export class FileProviderModule {}
