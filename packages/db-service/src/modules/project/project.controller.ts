import { Controller } from '@nestjs/common';
import { Prisma, Project } from '@prisma/client';
import {
  CreateProjectRequest,
  ProjectIdentifier,
  ProjectServiceController,
  ProjectServiceControllerMethods,
  UpdateProjectRequest,
} from 'src/gen/project';
import { ProjectService } from './project.service';

@Controller()
@ProjectServiceControllerMethods()
export class ProjectController implements ProjectServiceController {
  constructor(private readonly projectService: ProjectService) {}

  private validateIdentifier(identifier: ProjectIdentifier) {
    if (identifier.id && identifier.name) {
      throw new Error('Only one of id or name can be provided');
    } else if (!identifier.id && !identifier.name) {
      throw new Error('Neither id nor name are provided');
    }
  }

  async getProject(identifier: ProjectIdentifier): Promise<Project> {
    this.validateIdentifier(identifier);
    let project: Project;
    if (identifier.id) {
      project = await this.projectService.project({
        id: identifier.id,
      });
    } else {
      project = await this.projectService.project({
        name: identifier.name,
      });
    }
    return project;
  }

  async createProject(request: CreateProjectRequest): Promise<Project> {
    const project = await this.projectService.createProject({
      name: request.name,
    });
    return project;
  }

  async updateProject(request: UpdateProjectRequest): Promise<Project> {
    this.validateIdentifier(request.projectIdentifier);
    let projectFind: Prisma.ProjectWhereUniqueInput;
    if (request.projectIdentifier.id) {
      projectFind = {
        id: request.projectIdentifier.id,
      };
    } else {
      projectFind = {
        name: request.projectIdentifier.name,
      };
    }
    const project = await this.projectService.updateProject(projectFind, {
      name: request.updateParams.name,
    });
    return project;
  }

  async deleteProject(identifier: ProjectIdentifier): Promise<Project> {
    this.validateIdentifier(identifier);
    let project: Project;
    if (identifier.id) {
      project = await this.projectService.deleteProject({
        id: identifier.id,
      });
    } else {
      project = await this.projectService.deleteProject({
        name: identifier.name,
      });
    }
    return project;
  }
}
