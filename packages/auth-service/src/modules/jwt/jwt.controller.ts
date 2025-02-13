import { Controller, Inject } from '@nestjs/common';
import { JwtProto, ApiKeyProto, UserProto } from 'juno-proto';
import * as jwt from 'jsonwebtoken';
import { ClientGrpc } from '@nestjs/microservices';
import { createHash } from 'crypto';
import { lastValueFrom } from 'rxjs';

@Controller('jwt')
@JwtProto.JwtServiceControllerMethods()
export class JWTController implements JwtProto.JwtServiceController {
  private apiKeyDbService: ApiKeyProto.ApiKeyDbServiceClient;
  private userDbService: UserProto.UserServiceClient;

  constructor(
    @Inject(ApiKeyProto.API_KEY_DB_SERVICE_NAME)
    private apiKeyClient: ClientGrpc,
    @Inject(UserProto.USER_SERVICE_NAME)
    private userClient: ClientGrpc,
  ) {}

  onModuleInit() {
    this.apiKeyDbService =
      this.apiKeyClient.getService<ApiKeyProto.ApiKeyDbServiceClient>(
        ApiKeyProto.API_KEY_DB_SERVICE_NAME,
      );

    this.userDbService =
      this.userClient.getService<UserProto.UserServiceClient>(
        UserProto.USER_SERVICE_NAME,
      );
  }
  async createApiKeyJwt(
    request: JwtProto.CreateApiKeyJwtRequest,
  ): Promise<JwtProto.CreateJwtResponse> {
    const apiKeyHash = createHash('sha256')
      .update(request.apiKey)
      .digest('hex');
    const apiKey = await lastValueFrom(
      this.apiKeyDbService.getApiKey({
        hash: apiKeyHash,
      }),
    );

    if (!apiKey) {
      throw new Error('Invalid API Key');
    }

    const token = jwt.sign(
      {
        apiKeyHash: apiKeyHash,
      },
      process.env.JWT_SECRET ?? 'secret',
    );

    return { jwt: token };
  }
  async validateApiKeyJwt(
    request: JwtProto.ValidateJwtRequest,
  ): Promise<JwtProto.ValidateApiKeyJwtResponse> {
    try {
      const { apiKeyHash } = <jwt.ApiKeyHashJWTPayload>(
        jwt.verify(request.jwt, process.env.JWT_SECRET ?? 'secret')
      );
      const apiKey = await lastValueFrom(
        this.apiKeyDbService.getApiKey({
          hash: apiKeyHash,
        }),
      );

      if (apiKey) {
        return {
          valid: true,
          apiKey,
        };
      }
      return { valid: false };
    } catch (e) {
      throw new Error(e.message);
    }
  }
  async createUserJwt(
    request: JwtProto.CreateUserJwtRequest,
  ): Promise<JwtProto.CreateJwtResponse> {
    const user = await lastValueFrom(
      this.userDbService.getUser({
        id: request.user.id,
      }),
    );

    if (!user) {
      throw new Error('Invalid API Key');
    }

    const token = jwt.sign(
      {
        user: user,
      },
      process.env.JWT_SECRET ?? 'secret',
    );

    return { jwt: token };
  }
  async validateUserJwt(
    request: JwtProto.ValidateJwtRequest,
  ): Promise<JwtProto.ValidateUserJwtResponse> {
    try {
      const { user } = <jwt.UserJWTPayload>(
        jwt.verify(request.jwt, process.env.JWT_SECRET ?? 'secret')
      );
      const userVerify = await lastValueFrom(
        this.userDbService.getUser({
          id: user.id,
        }),
      );

      if (userVerify) {
        return {
          valid: true,
          user,
        };
      }
      return { valid: false };
    } catch (e) {
      throw new Error(e.message);
    }
  }
}
