import { Controller, HttpStatus, Inject } from '@nestjs/common';
import { UserProto } from 'juno-proto';
import { lastValueFrom } from 'rxjs';
import * as bcrypt from 'bcrypt';
import { ClientGrpc, RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { AuthenticateUserRequest } from 'src/models/auth_user';
import { ApiResponse, ApiTags, ApiBody, ApiOperation } from '@nestjs/swagger';
import { UserResponse } from '../../../../api-gateway/src/models/user';

@ApiTags('api_key')
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

  @ApiOperation({ summary: 'Authenticate a user' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User successfully authenticated',
    type: UserResponse,
  })
  @ApiBody({
    type: AuthenticateUserRequest,
    description: 'Payload to authenticate a user',
  })
  async authenticate(
    request: UserProto.AuthenticateUserRequest,
  ): Promise<UserProto.User> {
    let passwordHash: UserProto.UserPasswordHash;
    try {
      passwordHash = await lastValueFrom(
        this.userService.getUserPasswordHash({
          email: request.email,
        }),
      );
    } catch (e) {
      console.log(`${JSON.stringify(e)}`);
      throw new RpcException({
        code: status.NOT_FOUND,
        message: 'No user found for email',
      });
    }

    try {
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
    } catch (e) {
      throw e;
    }
  }
}
