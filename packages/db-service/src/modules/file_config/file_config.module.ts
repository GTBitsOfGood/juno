import { Module } from '@nestjs/common';
import { FileConfigController } from './file_config.controller';
import { FileServiceConfigService } from './file_config.service';
import { PrismaService } from 'src/prisma.service';

@Module({
  controllers: [FileConfigController],
  providers: [FileServiceConfigService, PrismaService],
})
export class FileConfigModule {}
