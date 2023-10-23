import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Inject,
  OnModuleInit,
  Param,
  Post,
} from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import {
  PROJECT_SERVICE_NAME,
  Project,
  ProjectServiceClient,
} from 'src/db-service/gen/project';
import { CreateProjectModel } from 'src/models/project';

@Controller('project')
export class ProjectController implements OnModuleInit {
  private projectService: ProjectServiceClient;

  constructor(
    @Inject(PROJECT_SERVICE_NAME) private projectClient: ClientGrpc,
  ) {}

  onModuleInit() {
    this.projectService =
      this.projectClient.getService<ProjectServiceClient>(PROJECT_SERVICE_NAME);
  }

  @Get('id/:id')
  async getProjectById(@Param('id') idStr: string): Promise<Project> {
    const id = parseInt(idStr);
    if (Number.isNaN(id)) {
      throw new HttpException('id must be a number', HttpStatus.BAD_REQUEST);
    }
    const project = this.projectService.getProject({
      id,
    });

    return lastValueFrom(project);
  }

  @Get('name/:name')
  async getProjectByName(@Param('name') name: string): Promise<Project> {
    const project = this.projectService.getProject({
      name,
    });

    return lastValueFrom(project);
  }

  @Post()
  async createProject(@Body() params: CreateProjectModel) {
    const project = this.projectService.createProject({
      name: params.name,
    });

    await lastValueFrom(project);
  }
}
