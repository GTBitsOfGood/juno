import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { DomainService } from './domain.service';
import { DomainDbController } from './domain.controller';

@Module({
  controllers: [DomainDbController],
  providers: [DomainService, PrismaService],
})
export class AuthModule {}
