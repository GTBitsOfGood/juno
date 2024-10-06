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
import {
  ApiResponse,
  ApiTags,
  ApiParam,
  ApiBody,
  ApiOperation,
} from '@nestjs/swagger';
import { ClientGrpc } from '@nestjs/microservices';
import { UserProto } from 'juno-proto';
import { lastValueFrom } from 'rxjs';
import {
  CreateUserModel,
  LinkProjectModel,
  SetUserTypeModel,
  UserResponse,
} from 'src/models/user.dto';
import { User } from 'src/decorators/user.decorator';

const { USER_SERVICE_NAME } = UserProto;

@ApiTags('user')
@Controller('user')
export class UserController implements OnModuleInit {
  private userService: UserProto.UserServiceClient;

  constructor(@Inject(USER_SERVICE_NAME) private userClient: ClientGrpc) {}

  onModuleInit() {
    this.userService =
      this.userClient.getService<UserProto.UserServiceClient>(
        USER_SERVICE_NAME,
      );
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
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error.',
  })
  async createUser(
    @User() user: UserProto.User,
    @Body() params: CreateUserModel,
  ) {
    if (user.type !== UserProto.UserType.SUPERADMIN) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }
    const createdUser = this.userService.createUser({
      ...params,
      type: UserProto.UserType.USER,
    });

    return new UserResponse(await lastValueFrom(createdUser));
  }

  @Post('type')
  @ApiOperation({
    summary: 'Update user type.',
    description:
      'Updates the user type for an existing user. User type can be thought of as a role with role-based permissions, e.g. SUPERADMIN could have permissions an ADMIN would not. Only SUPERADMIN users can set types',
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
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error.',
  })
  async setUserType(
    @User() user: UserProto.User,
    @Body() setUserTypeParams: SetUserTypeModel,
  ) {
    if (user.type !== UserProto.UserType.SUPERADMIN) {
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
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error.',
  })
  async linkUserWithProjectId(
    @User() user: UserProto.User,
    @Param('id') idStr: string,
    @Body() linkProjectBody: LinkProjectModel,
  ) {
    if (user.type !== UserProto.UserType.SUPERADMIN) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }
    const id = parseInt(idStr);
    if (Number.isNaN(id)) {
      throw new HttpException('id must be a number', HttpStatus.BAD_REQUEST);
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
}
