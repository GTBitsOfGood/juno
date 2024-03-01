import { Module } from '@nestjs/common';
import { EmailController } from './email.controller';
import { EmailService } from './email.service';
import { PrismaService } from 'src/prisma.service';

@Module({
  controllers: [EmailController],
  providers: [EmailService, PrismaService],
})
export class ProjectModule {}
