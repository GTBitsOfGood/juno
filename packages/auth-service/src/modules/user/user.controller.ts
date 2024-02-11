import { Controller } from '@nestjs/common';
import { UserProto } from 'juno-proto';
import { UserIdentifier } from 'juno-proto/dist/gen/identifiers';
import { Observable } from 'rxjs';
import { AuthenticateUserBody } from 'src/models/user';

@Controller('api_key')
@UserProto.UserServiceControllerMethods()
export class UserController implements UserProto.UserServiceController {
  constructor(private readonly userService: UserProto.UserServiceClient) {}

  getUser(
    request: UserIdentifier,
  ): UserProto.User | Promise<UserProto.User> | Observable<UserProto.User> {
    throw new Error('Method not implemented.');
  }
  createUser(
    request: UserProto.CreateUserRequest,
  ): UserProto.User | Promise<UserProto.User> | Observable<UserProto.User> {
    throw new Error('Method not implemented.');
  }
  updateUser(
    request: UserProto.UpdateUserRequest,
  ): UserProto.User | Promise<UserProto.User> | Observable<UserProto.User> {
    throw new Error('Method not implemented.');
  }
  deleteUser(
    request: UserIdentifier,
  ): UserProto.User | Promise<UserProto.User> | Observable<UserProto.User> {
    throw new Error('Method not implemented.');
  }
  linkProject(
    request: UserProto.LinkProjectToUserRequest,
  ): UserProto.User | Promise<UserProto.User> | Observable<UserProto.User> {
    throw new Error('Method not implemented.');
  }
  authenticate(
    request: AuthenticateUserBody,
  ): UserProto.User | Promise<UserProto.User> | Observable<UserProto.User> {
    const user = this.userService.authenticate(request);
    return user;
  }
}
