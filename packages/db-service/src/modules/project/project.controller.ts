import { Controller } from '@nestjs/common';
import { Project } from '@prisma/client';
import { ProjectService } from './project.service';
import {
  validateProjectIdentifier,
  validateUserIdentifier,
} from 'src/utility/validate';
import { IdentifierProto, ProjectProto } from 'juno-proto';

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
    return project;
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
