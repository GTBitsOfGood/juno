import { Controller, Inject } from '@nestjs/common';
import { ClientGrpc, RpcException } from '@nestjs/microservices';
import { ApiKeyProto, AuthCommonProto, UserProto } from 'juno-proto';
import { lastValueFrom } from 'rxjs';
import { createHash, randomBytes } from 'crypto';
import { status } from '@grpc/grpc-js';

@Controller('API_Key')
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
  async validateApiKey(
    request: ApiKeyProto.ValidateApiKeyRequest,
  ): Promise<ApiKeyProto.ValidateApiKeyResponse> {
    const apiKeyHash = createHash('sha256')
      .update(request.apiKey)
      .digest('hex');
    const apiKey = await lastValueFrom(
      this.apiKeyDbService.getApiKey({
        hash: apiKeyHash,
      }),
    );

    if (!apiKey) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: 'Api key not found',
      });
    }

    return {
      valid: true,
      key: apiKey,
    };
  }

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
    const rawApiKey = randomBytes(32).toString('hex');
    const apiKeyHash = createHash('sha256').update(rawApiKey).digest('hex');
    const key = this.apiKeyDbService.createApiKey({
      apiKey: {
        hash: apiKeyHash,
        description: request.description,
        scopes: [AuthCommonProto.ApiScope.FULL],
        project: request.project,
        environment: request.environment,
      },
    });
    if (!key) {
      throw new RpcException({
        code: status.FAILED_PRECONDITION,
        message: 'Failed to create API Key',
      });
    }
    return {
      apiKey: rawApiKey,
      info: await lastValueFrom(key),
    };
  }
  async revokeApiKey(
    request: ApiKeyProto.RevokeApiKeyRequest,
  ): Promise<ApiKeyProto.RevokeApiKeyResponse> {
    const hash = createHash('sha256').update(request.apiKey).digest('hex');
    const key = this.apiKeyDbService.deleteApiKey({
      hash,
    });
    if (!key) {
      return { success: false };
    }
    return { success: true };
  }
}
