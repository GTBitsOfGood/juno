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
  USER_SERVICE_NAME,
  User,
  UserServiceClient,
  UserType,
} from 'src/db-service/gen/user';
import { CreateUserModel, SetUserTypeModel } from 'src/models/user';

@Controller('user')
export class UserController implements OnModuleInit {
  private userService: UserServiceClient;

  constructor(@Inject(USER_SERVICE_NAME) private userClient: ClientGrpc) {}

  onModuleInit() {
    this.userService =
      this.userClient.getService<UserServiceClient>(USER_SERVICE_NAME);
  }

  @Get('id/:id')
  async getUserById(@Param('id') idStr: string): Promise<User> {
    const id = parseInt(idStr);
    if (Number.isNaN(id)) {
      throw new HttpException('id must be a number', HttpStatus.BAD_REQUEST);
    }
    const user = this.userService.getUser({
      id,
    });

    return lastValueFrom(user);
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
}
