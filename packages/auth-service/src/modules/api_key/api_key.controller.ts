import { Controller, Inject } from '@nestjs/common';
import { ClientGrpc, RpcException } from '@nestjs/microservices';
import { ApiKeyProto, AuthCommonProto, UserProto } from 'juno-proto';
import { lastValueFrom } from 'rxjs';
import { randomBytes } from 'crypto';
import { status } from '@grpc/grpc-js';
import { hashApiKey } from './api_key.utils';

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

  async validateApiKey(
    request: ApiKeyProto.ValidateApiKeyRequest,
  ): Promise<ApiKeyProto.ValidateApiKeyResponse> {
    const apiKeyHash = hashApiKey(request.apiKey);
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

  async getApiKey(
    request: ApiKeyProto.GetApiKeyRequest,
  ): Promise<ApiKeyProto.GetApiKeyResponse> {
    const apiKey = await lastValueFrom(this.apiKeyDbService.getApiKey(request));
    return { key: apiKey };
  }

  async issueApiKey(
    request: ApiKeyProto.IssueApiKeyRequest,
  ): Promise<ApiKeyProto.IssueApiKeyResponse> {
    const rawApiKey = randomBytes(32).toString('hex');
    const apiKeyHash = hashApiKey(rawApiKey);

    const info = await lastValueFrom(
      this.apiKeyDbService.createApiKey({
        apiKey: {
          hash: apiKeyHash,
          description: request.description,
          scopes: [AuthCommonProto.ApiScope.FULL],
          project: request.project,
          environment: request.environment,
          createdAt: new Date().toISOString(),
        },
      }),
    );

    if (!info) {
      throw new RpcException({
        code: status.FAILED_PRECONDITION,
        message: 'Failed to create API Key',
      });
    }

    return {
      apiKey: rawApiKey,
      info,
    };
  }

  async getAllApiKeys(
    request: ApiKeyProto.GetAllApiKeysRequest,
  ): Promise<ApiKeyProto.GetAllApiKeysResponse> {
    const result = await lastValueFrom(
      this.apiKeyDbService.getAllApiKeys({
        offset: request.offset ?? 0,
        limit: request.limit ?? undefined,
        projects: request.projects ?? [],
      }),
    );
    const keys = result.keys ?? [];

    return {
      keys: keys.map((key) => ({
        ...key,
        scopes: key.scopes ?? [],
      })),
      count: result.count,
    };
  }

  async deleteApiKey(
    request: ApiKeyProto.DeleteApiKeyRequest,
  ): Promise<ApiKeyProto.DeleteApiKeyResponse> {
    await lastValueFrom(this.apiKeyDbService.deleteApiKey({ id: request.id }));
    return { success: true };
  }

  async revokeApiKey(
    request: ApiKeyProto.RevokeApiKeyRequest,
  ): Promise<ApiKeyProto.RevokeApiKeyResponse> {
    const hash = hashApiKey(request.apiKey);
    await lastValueFrom(this.apiKeyDbService.deleteApiKey({ hash }));
    return { success: true };
  }
}
