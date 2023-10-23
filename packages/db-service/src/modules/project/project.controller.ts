import { Controller } from '@nestjs/common';
import { Project } from '@prisma/client';
import {
  CreateProjectRequest,
  LinkUserToProjectRequest,
  ProjectServiceController,
  ProjectServiceControllerMethods,
  UpdateProjectRequest,
} from 'src/gen/project';
import { ProjectService } from './project.service';
import {
  validateProjectIdentifier,
  validateUserIdentifier,
} from 'src/utility/validate';
import { ProjectIdentifier } from 'src/gen/shared/identifiers';

@Controller()
@ProjectServiceControllerMethods()
export class ProjectController implements ProjectServiceController {
  constructor(private readonly projectService: ProjectService) {}

  async getProject(identifier: ProjectIdentifier): Promise<Project> {
    const params = validateProjectIdentifier(identifier);
    const project = await this.projectService.project(params);
    return project;
  }

  async createProject(request: CreateProjectRequest): Promise<Project> {
    const project = await this.projectService.createProject({
      name: request.name,
    });
    return project;
  }

  async updateProject(request: UpdateProjectRequest): Promise<Project> {
    const projectFind = validateProjectIdentifier(request.projectIdentifier);
    const project = await this.projectService.updateProject(projectFind, {
      name: request.updateParams.name,
    });
    return project;
  }

  async deleteProject(identifier: ProjectIdentifier): Promise<Project> {
    const projectParams = validateProjectIdentifier(identifier);
    return this.projectService.deleteProject(projectParams);
  }

  async linkUser(request: LinkUserToProjectRequest): Promise<Project> {
    const project = validateProjectIdentifier(request.project);
    return this.projectService.updateProject(project, {
      users: {
        connect: validateUserIdentifier(request.user),
      },
    });
  }
}
