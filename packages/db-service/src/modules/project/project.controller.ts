import { Controller } from '@nestjs/common';
import { Project } from '@prisma/client';
import { ProjectService } from './project.service';
import {
  validateProjectIdentifier,
  validateUserIdentifier,
} from 'src/utility/validate';
import { IdentifierProto, ProjectProto, CommonProto } from 'juno-proto';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { GetUsersFromProject } from 'juno-proto/dist/gen/user';
import { mapPrismaRoleToRPC } from 'src/utility/convert';
@Controller()
@ProjectProto.ProjectServiceControllerMethods()
export class ProjectController
  implements ProjectProto.ProjectServiceController
{
  constructor(private readonly projectService: ProjectService) {}

  async getProject(
    identifier: IdentifierProto.ProjectIdentifier,
  ): Promise<Project> {
    const params = validateProjectIdentifier(identifier);
    const project = await this.projectService.project(params);
    if (!project) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: 'Project not found',
      });
    }
    return project;
  }

  async getAllProjects(
    _: ProjectProto.GetAllProjectsRequest,
  ): Promise<CommonProto.Projects> {
    void _; //Indicates to linter input not used
    const projects = await this.projectService.projects();
    return { projects: projects };
  }

  async getUsersFromProject(
    input: GetUsersFromProject,
  ): Promise<CommonProto.Users> {
    const users = await this.projectService.getUsersWithProject(
      input.projectId,
    );
    return {
      users: users.map((user) => {
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          type: mapPrismaRoleToRPC(user.type),
          projectIds: user.allowedProjects.map((project) => project.id),
        };
      }),
    };
  }

  async createProject(
    request: ProjectProto.CreateProjectRequest,
  ): Promise<Project> {
    const project = await this.projectService.createProject({
      name: request.name,
    });
    return project;
  }

  async updateProject(
    request: ProjectProto.UpdateProjectRequest,
  ): Promise<Project> {
    const projectFind = validateProjectIdentifier(request.projectIdentifier);
    const project = await this.projectService.updateProject(projectFind, {
      name: request.updateParams.name,
    });
    return project;
  }

  async deleteProject(
    identifier: IdentifierProto.ProjectIdentifier,
  ): Promise<Project> {
    const projectParams = validateProjectIdentifier(identifier);
    return this.projectService.deleteProject(projectParams);
  }

  async linkUser(
    request: ProjectProto.LinkUserToProjectRequest,
  ): Promise<Project> {
    const project = validateProjectIdentifier(request.project);
    return this.projectService.updateProject(project, {
      users: {
        connect: validateUserIdentifier(request.user),
      },
    });
  }
}
