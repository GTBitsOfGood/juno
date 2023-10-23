import {
  Body,
  Controller,
  Get,
  Inject,
  OnModuleInit,
  Post,
} from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import {
  API_KEY_SERVICE_NAME,
  ApiKeyServiceClient,
} from 'src/auth-service/gen/api_key';
import { JWT_SERVICE_NAME, JwtServiceClient } from 'src/auth-service/gen/jwt';
import {
  USER_SERVICE_NAME,
  UserServiceClient,
  UserType,
} from 'src/auth-service/gen/user';
import { CreateUserModel, SetUserTypeModel } from 'src/models/user';

@Controller('auth')
export class AuthController implements OnModuleInit {
  private jwtService: JwtServiceClient;
  private apiKeyService: ApiKeyServiceClient;
  private userService: UserServiceClient;

  constructor(
    @Inject(JWT_SERVICE_NAME) private jwtClient: ClientGrpc,
    @Inject(API_KEY_SERVICE_NAME) private apiClient: ClientGrpc,
    @Inject(USER_SERVICE_NAME) private userClient: ClientGrpc,
  ) {}

  onModuleInit() {
    this.jwtService =
      this.jwtClient.getService<JwtServiceClient>(JWT_SERVICE_NAME);
    this.apiKeyService =
      this.apiClient.getService<ApiKeyServiceClient>(API_KEY_SERVICE_NAME);
    this.userService =
      this.userClient.getService<UserServiceClient>(USER_SERVICE_NAME);
  }

  @Get()
  getJWT() {
    console.log('CALLED');
    this.apiKeyService.issueApiKey({}).subscribe();
  }

  @Post()
  async createUser(@Body() createUserParams: CreateUserModel) {
    const create = this.userService.createUser({
      ...createUserParams,
      type: UserType.USER,
    });

    await lastValueFrom(create);
  }

  @Post()
  async setUserType(@Body() setUserTypeParams: SetUserTypeModel) {
    await lastValueFrom(
      this.userService.setUserType({
        identifier: {
          id: setUserTypeParams.id,
          email: setUserTypeParams.email,
        },
        type: setUserTypeParams.type,
      }),
    );
  }
}
