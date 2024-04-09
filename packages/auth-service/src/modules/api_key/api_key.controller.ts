import { Controller, Inject } from '@nestjs/common';
import { ClientGrpc, RpcException } from '@nestjs/microservices';
import { ApiKeyProto, UserProto } from 'juno-proto';
import { lastValueFrom } from 'rxjs';
import { createHash, randomBytes } from 'crypto';
import { status } from '@grpc/grpc-js';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import {
  IssueApiKeyResponse,
  IssueApiKeyRequest,
  RevokeApiKeyRequest,
  RevokeApiKeyResponse,
} from 'juno-proto/dist/gen/api_key';

@ApiTags('api_key')
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

  @ApiOperation({ summary: 'Issue an API key' })
  @ApiResponse({
    status: 200,
    description: 'API key successfully issued.',
    type: IssueApiKeyResponse,
  })
  @ApiBody({
    type: IssueApiKeyRequest,
    description: 'Payload to issue a new API key.',
  })
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
          code: status.PERMISSION_DENIED,
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
          environment: request.environment,
        },
      });
      if (!key) {
        throw new RpcException({
          code: status.INTERNAL,
          message: 'Failed to create API Key',
        });
      }
      return {
        apiKey: await lastValueFrom(key),
      };
    } catch (e) {
      throw e;
    }
  }

  @ApiOperation({ summary: 'Revoke an API key' })
  @ApiResponse({
    status: 200,
    description: 'API key successfully revoked.',
    type: RevokeApiKeyRequest as any,
  })
  @ApiBody({
    type: RevokeApiKeyResponse as any,
    description: 'Payload to revoke an API key.',
  })
  async revokeApiKey(
    request: ApiKeyProto.RevokeApiKeyRequest,
  ): Promise<ApiKeyProto.RevokeApiKeyResponse> {
    console.log(`request: ${request}`);
    throw new Error('Method not implemented.');
  }
}
