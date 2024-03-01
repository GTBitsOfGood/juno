import { MiddlewareConsumer, Module } from '@nestjs/common';
import { DomainController } from './domain.controller';
import { ProjectLinkingMiddleware } from 'src/middleware/project.middleware';

@Module({ controllers: [DomainController] })
export class DomainModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(ProjectLinkingMiddleware).forRoutes('domain/*');
  }
}
