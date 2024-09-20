import { Module } from '@nestjs/common';
import { EmailController } from './email.controller';
import { EmailService } from './email.service';
import { PrismaService } from 'src/prisma.service';

@Module({
  providers: [EmailService, PrismaService],
  controllers: [EmailController],
})
export class EmailModule {}
