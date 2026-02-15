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
      // Handle expected NOT_FOUND errors (invalid/deleted users) vs unexpected errors
      if (e.code === status.NOT_FOUND) {
        // Expected case - user doesn't exist, don't log to Sentry
        throw new RpcException({
          code: status.NOT_FOUND,
          message: 'No user found for email',
        });
      } else {
        // Unexpected error (database failure, network issue, etc.) - log to Sentry
        console.log(
          `Unexpected error in getUserPasswordHash: ${JSON.stringify(e)}`,
        );
        throw new RpcException({
          code: status.UNKNOWN,
          message: 'An unexpected error occurred during authentication',
        });
      }
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
