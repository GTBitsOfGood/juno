import { Controller, Inject } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { ApiKeyProto, UserProto } from 'juno-proto';
import { Observable, lastValueFrom } from 'rxjs';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';

@Controller('api_key')
@ApiKeyProto.ApiKeyServiceControllerMethods()
export class ApiKeyController implements ApiKeyProto.ApiKeyServiceController {
  private userService: UserProto.UserServiceClient;
  private apiKeyDbService: ApiKeyProto.ApiKeyDbServiceClient;

  constructor(
    @Inject(ApiKeyProto.API_KEY_DB_SERVICE_NAME)
    private apiKeyClient: ClientGrpc,
    @Inject(UserProto.USER_SERVICE_NAME) private userClient: ClientGrpc,
  ) {}

  onModuleInit() {
    this.apiKeyDbService =
      this.apiKeyClient.getService<ApiKeyProto.ApiKeyDbServiceClient>(
        ApiKeyProto.API_KEY_DB_SERVICE_NAME,
      );
    this.userService = this.userClient.getService<UserProto.UserServiceClient>(
      UserProto.USER_SERVICE_NAME,
    );
    console.log('initialized services');
  }

  async issueApiKey(
    request: ApiKeyProto.IssueApiKeyRequest,
  ): Promise<ApiKeyProto.IssueApiKeyResponse> {
    let password: Observable<UserProto.UserPasswordHash>;
    try {
      password = this.userService.getUserPasswordHash({
        email: request.email,
      });
    } catch (e) {
      throw new Error('Failed to look up password hash for user');
    }
    const userPasswordHash = (await lastValueFrom(password)).hash;

    // TODO: Validate user type before generating key (only linked admin or any superadmin)

    try {
      const passwordEquals = await bcrypt.compare(
        request.password,
        userPasswordHash,
      );
      if (!passwordEquals) {
        throw new Error(
          `Password Hash Mismatch on description ${request.description}`,
        );
      } else {
        const rawApiKey = randomBytes(32).toString('hex');
        const apiKeyHash = createHash('sha256').update(rawApiKey).digest('hex');
        const key = this.apiKeyDbService.createApiKey({
          apiKey: {
            hash: apiKeyHash,
            description: request.description,
            scopes: [ApiKeyProto.ApiScope.FULL],
            project: {
              name: request.projectName,
            },
          },
        });
        if (!key) {
          throw new Error('Failed to create API key');
        }
        return {
          apiKey: await lastValueFrom(key),
        };
      }
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
