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
  Put,
} from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import {
  PROJECT_SERVICE_NAME,
  ProjectServiceClient,
} from 'src/db-service/gen/project';
import {
  CreateProjectModel,
  LinkUserModel,
  ProjectResponse,
} from 'src/models/project';

@Controller('project')
export class ProjectController implements OnModuleInit {
  private projectService: ProjectServiceClient;

  constructor(
    @Inject(PROJECT_SERVICE_NAME) private projectClient: ClientGrpc,
  ) { }

  onModuleInit() {
    this.projectService =
      this.projectClient.getService<ProjectServiceClient>(PROJECT_SERVICE_NAME);
  }

  @Get('id/:id')
  async getProjectById(@Param('id') idStr: string): Promise<ProjectResponse> {
    const id = parseInt(idStr);
    if (Number.isNaN(id)) {
      throw new HttpException('id must be a number', HttpStatus.BAD_REQUEST);
    }
    const project = this.projectService.getProject({
      id,
    });

    return new ProjectResponse(await lastValueFrom(project));
  }

  @Get('name/:name')
  async getProjectByName(
    @Param('name') name: string,
  ): Promise<ProjectResponse> {
    const project = this.projectService.getProject({
      name,
    });

    return new ProjectResponse(await lastValueFrom(project));
  }

  @Post()
  async createProject(@Body() params: CreateProjectModel) {
    const project = this.projectService.createProject({
      name: params.name,
    });

    await lastValueFrom(project);
  }

  @Put('id/:id/user')
  async linkUserWithProjectId(
    @Param('id') idStr: string,
    @Body() linkUserBody: LinkUserModel,
  ) {
    const id = parseInt(idStr);
    if (Number.isNaN(id)) {
      throw new HttpException('id must be a number', HttpStatus.BAD_REQUEST);
    }
    const project = this.projectService.linkUser({
      project: {
        id,
      },
      user: {
        id: linkUserBody.id,
        email: linkUserBody.email,
      },
    });

    await lastValueFrom(project);
  }

  @Put('name/:name/user')
  async linkUserWithProjectName(
    @Param('name') name: string,
    @Body() linkUserBody: LinkUserModel,
  ) {
    const project = this.projectService.linkUser({
      project: {
        name,
      },
      user: {
        id: linkUserBody.id,
        email: linkUserBody.email,
      },
    });

    await lastValueFrom(project);
  }
}
