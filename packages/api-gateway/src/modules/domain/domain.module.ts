import { Module } from '@nestjs/common';
import { DomainController } from './domain.controller';

@Module({ controllers: [DomainController] })
export class DomainModule {}
