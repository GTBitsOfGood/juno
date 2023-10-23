import { Controller, Inject, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { USER_SERVICE_NAME, UserServiceClient } from 'src/db-service/gen/user';
import {
  UserServiceControllerMethods,
  UserServiceController,
  SetUserTypeRequest,
  EmptyResponse,
  CreateUserParams,
} from 'src/gen/user';

@Controller('user')
@UserServiceControllerMethods()
export class UserController implements UserServiceController, OnModuleInit {
  private userService: UserServiceClient;

  constructor(@Inject(USER_SERVICE_NAME) private userClient: ClientGrpc) {}

  async setUserType(request: SetUserTypeRequest): Promise<EmptyResponse> {
    const update = this.userService.updateUser({
      userIdentifier: request.identifier,
      updateParams: {
        type: request.type,
      },
    });

    await lastValueFrom(update);

    return {};
  }

  async createUser(request: CreateUserParams): Promise<EmptyResponse> {
    const create = this.userService.createUser({
      ...request,
    });
    await lastValueFrom(create);

    return {};
  }

  onModuleInit() {
    this.userService =
      this.userClient.getService<UserServiceClient>(USER_SERVICE_NAME);
  }
}
