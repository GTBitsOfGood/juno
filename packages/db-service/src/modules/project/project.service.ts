import { Injectable } from '@nestjs/common';
import { Prisma, Project } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';

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

  async project(lookup: Prisma.ProjectWhereUniqueInput): Promise<Project> {
    return this.prisma.project.findUnique({
      where: lookup,
    });
  }

  async createProject(input: Prisma.ProjectCreateInput): Promise<Project> {
    return this.prisma.project.create({
      data: input,
    });
  }

  async updateProject(
    project: Prisma.ProjectWhereUniqueInput,
    update: Prisma.ProjectUpdateInput,
  ): Promise<Project> {
    return this.prisma.project.update({
      where: project,
      data: update,
    });
  }

  async deleteProject(where: Prisma.ProjectWhereUniqueInput): Promise<Project> {
    return this.prisma.project.delete({
      where,
    });
  }
}
