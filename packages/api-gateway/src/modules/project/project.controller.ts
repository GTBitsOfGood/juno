import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Inject,
  OnModuleInit,
  Param,
  ParseIntPipe,
  Post,
  Put,
} from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import {
  CreateProjectModel,
  LinkUserModel,
  ProjectResponse,
} from 'src/models/project.dto';
import { AuthCommonProto, CommonProto, ProjectProto } from 'juno-proto';
import { ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { User } from 'src/decorators/user.decorator';
import { ApiKey } from 'src/decorators/api_key.decorator';

const { PROJECT_SERVICE_NAME } = ProjectProto;

@ApiTags('project')
@Controller('project')
export class ProjectController implements OnModuleInit {
  private projectService: ProjectProto.ProjectServiceClient;

  constructor(
    @Inject(PROJECT_SERVICE_NAME) private projectClient: ClientGrpc,
  ) {}

  onModuleInit() {
    this.projectService =
      this.projectClient.getService<ProjectProto.ProjectServiceClient>(
        PROJECT_SERVICE_NAME,
      );
  }

  @Get('id/:id')
  @ApiOperation({ summary: 'Retrieves a project by its unique ID.' })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'ID must be a number',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'No project with specified ID was found',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returned the project associated with the given ID',
    type: ProjectResponse,
  })
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
  @ApiOperation({ summary: 'Retrieves a project by its unique name.' })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'No project with specified name was found',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returned the project associated with the given name',
    type: ProjectResponse,
  })
  async getProjectByName(
    @Param('name') name: string,
  ): Promise<ProjectResponse> {
    const project = this.projectService.getProject({
      name,
    });
    return new ProjectResponse(await lastValueFrom(project));
  }

  @Post()
  @ApiOperation({
    summary: 'Creates a new project with the specified parameters.',
  })
  @ApiHeader({
    name: 'X-User-Email',
    description: 'Email of an admin or superadmin user',
    required: true,
    schema: {
      type: 'string',
    },
  })
  @ApiHeader({
    name: 'X-User-Password',
    description: 'Password of the admin or superadmin user',
    required: true,
    schema: {
      type: 'string',
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Name should not be empty',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Successfully created project',
    type: ProjectResponse,
  })
  async createProject(
    @User() user: CommonProto.User,
    @Body() params: CreateProjectModel,
  ) {
    if (user.type !== CommonProto.UserType.SUPERADMIN) {
      throw new HttpException(
        'Only Superadmins can create projects',
        HttpStatus.UNAUTHORIZED,
      );
    }
    const project = this.projectService.createProject({
      name: params.name,
    });

    return new ProjectResponse(await lastValueFrom(project));
  }

  @Put('id/:id/user')
  @ApiOperation({
    summary: 'Links a specified user with a given project ID.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid user credentials',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Cannot find valid user and/or project',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid user/project parameters',
  })
  async linkUserWithProjectId(
    @ApiKey() apiKey: AuthCommonProto.ApiKey,
    @Param('id', ParseIntPipe) id: number,
    @Body() linkUserBody: LinkUserModel,
  ) {
    if (Number(apiKey.project.id) != Number(id)) {
      throw new HttpException(
        'API Key is not for the specified project',
        HttpStatus.UNAUTHORIZED,
      );
    }
    if (Number.isNaN(linkUserBody.id) && !linkUserBody.email) {
      throw new HttpException(
        'Project id must be numeric',
        HttpStatus.BAD_REQUEST,
      );
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
  @ApiOperation({
    summary: 'Links a specified user with a given project name.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid user credentials',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Cannot find valid user and/or project',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid user/project parameters',
  })
  async linkUserWithProjectName(
    @ApiKey() apiKey: AuthCommonProto.ApiKey,
    @Param('name') name: string,
    @Body() linkUserBody: LinkUserModel,
  ) {
    const proj = await lastValueFrom(
      this.projectService.getProject({
        name: name,
      }),
    );
    if (Number(apiKey.project.id) != Number(proj.id)) {
      throw new HttpException(
        'API Key is not for the specified project',
        HttpStatus.UNAUTHORIZED,
      );
    }
    if (Number.isNaN(linkUserBody.id) && !linkUserBody.email) {
      throw new HttpException(
        'Project id must be numeric',
        HttpStatus.BAD_REQUEST,
      );
    }

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
