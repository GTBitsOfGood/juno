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
  Delete,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiResponse,
  ApiTags,
  ApiParam,
  ApiBody,
  ApiOperation,
  ApiHeader,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ClientGrpc } from '@nestjs/microservices';
import { CommonProto, ProjectProto, UserProto } from 'juno-proto';
import { lastValueFrom } from 'rxjs';
import {
  CreateUserModel,
  LinkProjectModel,
  SetUserTypeModel,
  UserResponse,
  UserResponses,
  UnlinkProjectModel,
} from 'src/models/user.dto';
import { User } from 'src/decorators/user.decorator';
import { userLinkedToProject } from 'src/user_project_validator';

const { USER_SERVICE_NAME } = UserProto;
const { PROJECT_SERVICE_NAME } = ProjectProto;

@ApiBearerAuth('API_Key')
@ApiTags('user')
@Controller('user')
export class UserController implements OnModuleInit {
  private userService: UserProto.UserServiceClient;
  private projectService: ProjectProto.ProjectServiceClient;

  constructor(
    @Inject(USER_SERVICE_NAME) private userClient: ClientGrpc,
    @Inject(PROJECT_SERVICE_NAME) private projectClient: ClientGrpc,
  ) {}

  onModuleInit() {
    this.userService =
      this.userClient.getService<UserProto.UserServiceClient>(
        USER_SERVICE_NAME,
      );
    this.projectService =
      this.projectClient.getService<ProjectProto.ProjectServiceClient>(
        PROJECT_SERVICE_NAME,
      );
  }

  @Get()
  @ApiOperation({ summary: 'Retrieves all users.' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returned all users',
    type: UserResponses,
  })
  @ApiHeader({
    name: 'X-User-Email',
    description: 'Email of an admin or superadmin user',
    required: false,
    schema: {
      type: 'string',
    },
  })
  @ApiHeader({
    name: 'X-User-Password',
    description: 'Password of the admin or superadmin user',
    required: false,
    schema: {
      type: 'string',
    },
  })
  async getAllUsers(@User() user: CommonProto.User): Promise<UserResponses> {
    if (user == undefined || user.type != CommonProto.UserType.SUPERADMIN) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }
    const users = this.userService.getAllUsers({});
    return new UserResponses(await lastValueFrom(users));
  }

  @Get('id/:id')
  @ApiOperation({ summary: 'Retrieve an existing user.' })
  @ApiParam({
    name: 'id',
    required: true,
    description: 'The unique identifier of the user',
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'id must be a number',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The found user',
    type: UserResponse,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'No user with id found',
  })
  async getUserById(@Param('id') idStr: string): Promise<UserResponse> {
    const id = parseInt(idStr);
    if (Number.isNaN(id)) {
      throw new HttpException('id must be a number', HttpStatus.BAD_REQUEST);
    }
    const user = this.userService.getUser({
      id,
    });

    return new UserResponse(await lastValueFrom(user));
  }

  @Post()
  @ApiOperation({ summary: 'Create a new user.' })
  @ApiHeader({
    name: 'X-User-Email',
    description: 'Email of an admin or superadmin user',
    required: false,
    schema: {
      type: 'string',
    },
  })
  @ApiHeader({
    name: 'X-User-Password',
    description: 'Password of the admin or superadmin user',
    required: false,
    schema: {
      type: 'string',
    },
  })
  @ApiBody({ type: CreateUserModel, description: 'The user details' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The user has been successfully created.',
    type: UserResponse,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Bad request',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized operation',
  })
  async createUser(
    @User() user: CommonProto.User,
    @Body() params: CreateUserModel,
  ) {
    if (user.type == CommonProto.UserType.USER) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }
    const createdUser = this.userService.createUser({
      ...params,
      type: CommonProto.UserType.USER,
    });

    return new UserResponse(await lastValueFrom(createdUser));
  }

  @Post('type')
  @ApiOperation({
    summary: 'Update user type.',
    description:
      'Updates the user type for an existing user. User type can be thought of as a role with role-based permissions, e.g. SUPERADMIN could have permissions an ADMIN would not. Only SUPERADMIN users can set types',
  })
  @ApiHeader({
    name: 'X-User-Email',
    description: 'Email of an admin or superadmin user',
    required: false,
    schema: {
      type: 'string',
    },
  })
  @ApiHeader({
    name: 'X-User-Password',
    description: 'Password of the admin or superadmin user',
    required: false,
    schema: {
      type: 'string',
    },
  })
  @ApiBody({
    type: SetUserTypeModel,
    description: 'User ID, email, and the new type to be set',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The updated user',
    type: UserResponse,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Bad request',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized operation',
  })
  async setUserType(
    @User() user: CommonProto.User,
    @Body() setUserTypeParams: SetUserTypeModel,
  ) {
    if (user.type !== CommonProto.UserType.SUPERADMIN) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }
    await lastValueFrom(
      this.userService.updateUser({
        userIdentifier: {
          id: setUserTypeParams.id,
          email: setUserTypeParams.email,
        },
        updateParams: {
          type: setUserTypeParams.type,
        },
      }),
    );
  }

  @Put('id/:id/project')
  @ApiOperation({
    summary: 'Link user to project.',
    description: 'Associates a user with a project ID.',
  })
  @ApiParam({
    name: 'id',
    description: 'User ID being linked to a project',
    type: String,
  })
  @ApiHeader({
    name: 'X-User-Email',
    description: 'Email of an admin or superadmin user',
    required: false,
    schema: {
      type: 'string',
    },
  })
  @ApiHeader({
    name: 'X-User-Password',
    description: 'Password of the admin or superadmin user',
    required: false,
    schema: {
      type: 'string',
    },
  })
  @ApiBody({
    type: LinkProjectModel,
    description: 'Project details to link with the user',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Bad request',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User linked to project successfully.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized operation',
  })
  async linkUserWithProjectId(
    @User() user: CommonProto.User,
    @Param('id') idStr: string,
    @Body() linkProjectBody: LinkProjectModel,
  ) {
    const id = parseInt(idStr);
    if (Number.isNaN(id)) {
      throw new HttpException('id must be a number', HttpStatus.BAD_REQUEST);
    }
    const linked = await userLinkedToProject({
      project: {
        id,
      },
      user,
      projectClient: this.projectService,
    });
    if (!linked || user.type == CommonProto.UserType.USER) {
      throw new UnauthorizedException(
        'Only Superadmins & Linked Admins can link Users to Projects',
      );
    }
    const project = this.userService.linkProject({
      user: {
        id,
      },
      project: {
        id: linkProjectBody.id,
        name: linkProjectBody.name,
      },
    });

    await lastValueFrom(project);
  }

  @Delete('id/:id/project')
  @ApiOperation({
    summary: 'Unlink user from project.',
    description: 'Removes a user from a project.',
  })
  @ApiHeader({
    name: 'X-User-Email',
    description: 'Email of an admin or superadmin user',
    required: false,
    schema: {
      type: 'string',
    },
  })
  @ApiHeader({
    name: 'X-User-Password',
    description: 'Password of the admin or superadmin user',
    required: false,
    schema: {
      type: 'string',
    },
  })
  @ApiParam({
    name: 'id',
    description: 'User ID being unlinked from a project',
    type: String,
  })
  @ApiBody({
    type: UnlinkProjectModel,
    description: 'Project details to unlink from the user',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Bad request',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User unlinked from project successfully.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized operation',
  })
  async unlinkUserFromProject(
    @User() user: CommonProto.User,
    @Param('id') idStr: string,
    @Body() unlinkProjectBody: UnlinkProjectModel,
  ) {
    const id = parseInt(idStr);
    if (Number.isNaN(id)) {
      throw new HttpException('id must be a number', HttpStatus.BAD_REQUEST);
    }
    const linked = await userLinkedToProject({
      project: {
        id,
      },
      user,
      projectClient: this.projectService,
    });
    if (!linked || user.type == CommonProto.UserType.USER) {
      throw new UnauthorizedException(
        'Only Superadmins & Linked Admins can unlink Users from Projects',
      );
    }
    const project = this.userService.unlinkProject({
      user: {
        id,
      },
      project: {
        id: unlinkProjectBody.id,
        name: unlinkProjectBody.name,
      },
    });

    await lastValueFrom(project);
  }

  @Delete('id/:id')
  @ApiOperation({ summary: 'Delete an existing user.' })
  @ApiHeader({
    name: 'X-User-Email',
    description: 'Email of an admin or superadmin user',
    required: false,
    schema: {
      type: 'string',
    },
  })
  @ApiHeader({
    name: 'X-User-Password',
    description: 'Password of the admin or superadmin user',
    required: false,
    schema: {
      type: 'string',
    },
  })
  @ApiParam({
    name: 'id',
    required: true,
    description: 'ID of the user to be deleted',
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The deleted user',
    type: UserResponse,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'No user with this ID was found',
  })
  async deleteUserById(
    @User() user: CommonProto.User,
    @Param('id') idStr: string,
  ): Promise<UserResponse> {
    if (user.type == CommonProto.UserType.USER) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    const id = parseInt(idStr);
    if (Number.isNaN(id)) {
      throw new HttpException('ID must be a number', HttpStatus.BAD_REQUEST);
    }
    const deletedUser = this.userService.deleteUser({
      id,
    });

    return new UserResponse(await lastValueFrom(deletedUser));
  }
}
