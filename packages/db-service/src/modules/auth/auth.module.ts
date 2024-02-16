import { Module } from '@nestjs/common';
import { ApiKeyDbController } from './auth.controller';
import { AuthService } from './auth.service';
import { PrismaService } from 'src/prisma.service';

@Module({
  controllers: [ApiKeyDbController],
  providers: [AuthService, PrismaService],
})
export class AuthModule {}
