import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Inject,
  OnModuleInit,
  Param,
  Post,
  Put,
  UseInterceptors,
} from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import {
  USER_SERVICE_NAME,
  UserServiceClient,
  UserType,
} from 'src/db-service/gen/user';
import {
  CreateUserModel,
  LinkProjectModel,
  SetUserTypeModel,
  UserResponse,
} from 'src/models/user';

@Controller('user')
export class UserController implements OnModuleInit {
  private userService: UserServiceClient;

  constructor(@Inject(USER_SERVICE_NAME) private userClient: ClientGrpc) { }

  onModuleInit() {
    this.userService =
      this.userClient.getService<UserServiceClient>(USER_SERVICE_NAME);
  }

  @Get('id/:id')
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
  async createUser(@Body() params: CreateUserModel) {
    const user = this.userService.createUser({
      ...params,
      type: UserType.USER,
    });

    await lastValueFrom(user);
  }

  @Post('type')
  async setUserType(@Body() setUserTypeParams: SetUserTypeModel) {
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
  async linkUserWithProjectId(
    @Param('id') idStr: string,
    @Body() linkProjectBody: LinkProjectModel,
  ) {
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
