import { Controller, Inject } from '@nestjs/common';
import { ClientGrpc, RpcException } from '@nestjs/microservices';
import { ApiKeyProto, UserProto } from 'juno-proto';
import { lastValueFrom } from 'rxjs';
import { createHash, randomBytes } from 'crypto';
import { status } from '@grpc/grpc-js';

@Controller('api_key')
@ApiKeyProto.ApiKeyServiceControllerMethods()
export class ApiKeyController implements ApiKeyProto.ApiKeyServiceController {
  private userAuthService: UserProto.UserAuthServiceClient;
  private apiKeyDbService: ApiKeyProto.ApiKeyDbServiceClient;

  constructor(
    @Inject(ApiKeyProto.API_KEY_DB_SERVICE_NAME)
    private apiKeyClient: ClientGrpc,
    @Inject(UserProto.USER_AUTH_SERVICE_NAME)
    private userAuthClient: ClientGrpc,
  ) {}

  onModuleInit() {
    this.apiKeyDbService =
      this.apiKeyClient.getService<ApiKeyProto.ApiKeyDbServiceClient>(
        ApiKeyProto.API_KEY_DB_SERVICE_NAME,
      );
    this.userAuthService =
      this.userAuthClient.getService<UserProto.UserAuthServiceClient>(
        UserProto.USER_AUTH_SERVICE_NAME,
      );
  }

  async issueApiKey(
    request: ApiKeyProto.IssueApiKeyRequest,
  ): Promise<ApiKeyProto.IssueApiKeyResponse> {
    // TODO: Validate user type before generating key (only linked admin or any superadmin)

    try {
      const user = await lastValueFrom(
        this.userAuthService.authenticate({
          email: request.email,
          password: request.password,
        }),
      );

      if (user.type !== UserProto.UserType.SUPERADMIN) {
        throw new RpcException({
          status: status.PERMISSION_DENIED,
          message: 'User not permitted to generate keys',
        });
      }

      const rawApiKey = randomBytes(32).toString('hex');
      const apiKeyHash = createHash('sha256').update(rawApiKey).digest('hex');
      const key = this.apiKeyDbService.createApiKey({
        apiKey: {
          hash: apiKeyHash,
          description: request.description,
          scopes: [ApiKeyProto.ApiScope.FULL],
          project: request.project,
        },
      });
      if (!key) {
        throw new Error('Failed to create API key');
      }
      return {
        apiKey: await lastValueFrom(key),
      };
    } catch (e) {
      throw e;
    }
  }
  async revokeApiKey(
    request: ApiKeyProto.RevokeApiKeyRequest,
  ): Promise<ApiKeyProto.RevokeApiKeyResponse> {
    console.log(`request: ${request}`);
    throw new Error('Method not implemented.');
  }
}
