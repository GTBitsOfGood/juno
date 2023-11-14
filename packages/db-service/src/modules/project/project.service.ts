import { Injectable } from '@nestjs/common';
import { ApiKey, Prisma, Project } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';

type ProjectWithKeys = Project & {
  apiKeys: ApiKey[];
};

@Injectable()
export class ProjectService {
  constructor(private prisma: PrismaService) {}

  async projects(
    skip?: number,
    take?: number,
    cursor?: Prisma.ProjectWhereUniqueInput,
    where?: Prisma.ProjectWhereInput,
    orderBy?: Prisma.ProjectOrderByWithRelationInput,
  ): Promise<Project[]> {
    return this.prisma.project.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }

  async project(
    lookup: Prisma.ProjectWhereUniqueInput,
  ): Promise<ProjectWithKeys> {
    return this.prisma.project.findUnique({
      where: lookup,
      include: {
        apiKeys: true,
      },
    });
  }

  async createProject(
    input: Prisma.ProjectCreateInput,
  ): Promise<ProjectWithKeys> {
    return this.prisma.project.create({
      data: input,
      include: {
        apiKeys: true,
      },
    });
  }

  async updateProject(
    project: Prisma.ProjectWhereUniqueInput,
    update: Prisma.ProjectUpdateInput,
  ): Promise<ProjectWithKeys> {
    return this.prisma.project.update({
      where: project,
      data: update,
      include: {
        apiKeys: true,
      },
    });
  }

  async deleteProject(
    where: Prisma.ProjectWhereUniqueInput,
  ): Promise<ProjectWithKeys> {
    return this.prisma.project.delete({
      where,
      include: {
        apiKeys: true,
      },
    });
  }
}
