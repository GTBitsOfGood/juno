import { Controller, Inject } from '@nestjs/common';
import { CommonProto, UserProto } from 'juno-proto';
import { lastValueFrom } from 'rxjs';
import * as bcrypt from 'bcrypt';
import { ClientGrpc, RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';

@Controller('api_key')
@UserProto.UserAuthServiceControllerMethods()
export class UserController implements UserProto.UserAuthServiceController {
  private userService: UserProto.UserServiceClient;

  constructor(
    @Inject(UserProto.USER_SERVICE_NAME) private userClient: ClientGrpc,
  ) {}

  onModuleInit() {
    this.userService = this.userClient.getService<UserProto.UserServiceClient>(
      UserProto.USER_SERVICE_NAME,
    );
  }
  async authenticate(
    request: UserProto.AuthenticateUserRequest,
  ): Promise<CommonProto.User> {
    let passwordHash: UserProto.UserPasswordHash;
    try {
      passwordHash = await lastValueFrom(
        this.userService.getUserPasswordHash({
          email: request.email,
        }),
      );
    } catch (e) {
      // Only log unexpected errors to Sentry (NOT_FOUND is expected for invalid/deleted users)
      if (e.code !== status.NOT_FOUND) {
        console.log(
          `Unexpected error in getUserPasswordHash: ${JSON.stringify(e)}`,
        );
      }
      throw new RpcException({
        code: status.NOT_FOUND,
        message: 'No user found for email',
      });
    }

    const passwordEquals = await bcrypt.compare(
      request.password,
      passwordHash.hash,
    );
    if (!passwordEquals) {
      throw new RpcException({
        code: status.PERMISSION_DENIED,
        message: 'Incorrect password',
      });
    }
    return lastValueFrom(
      this.userService.getUser({
        email: request.email,
      }),
    );
  }
}
