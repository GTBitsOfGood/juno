import { Controller, Inject } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { ApiKeyProto, UserProto } from 'juno-proto';
import { Observable, lastValueFrom } from 'rxjs';
import bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';

@Controller('api_key')
@ApiKeyProto.ApiKeyServiceControllerMethods()
export class ApiKeyController implements ApiKeyProto.ApiKeyServiceController {
  private userService: UserProto.UserServiceClient;
  private apiKeyDbService: ApiKeyProto.ApiKeyDbServiceClient;

  constructor(
    @Inject(ApiKeyProto.API_KEY_SERVICE_NAME) private apiKeyClient: ClientGrpc,
    @Inject(UserProto.USER_SERVICE_NAME) private userClient: ClientGrpc,
  ) {}

  onModuleInit() {
    this.userService = this.userClient.getService<UserProto.UserServiceClient>(
      UserProto.USER_SERVICE_NAME,
    );
    this.apiKeyDbService =
      this.apiKeyClient.getService<ApiKeyProto.ApiKeyDbServiceClient>(
        ApiKeyProto.API_KEY_DB_SERVICE_NAME,
      );
  }

  async issueApiKey(
    request: ApiKeyProto.IssueApiKeyRequest,
  ): Promise<ApiKeyProto.IssueApiKeyResponse> {
    const password: Observable<UserProto.UserPasswordHash> =
      await this.userService.getUserPasswordHash({
        email: request.email,
      });

    try {
      const passwordHash = await bcrypt.hash(request.password, 10);
      const passwordEquals = bcrypt.compare(
        passwordHash,
        (await lastValueFrom(password)).hash,
      );
      if (!passwordEquals) {
        throw new Error('Password Hash Mismatch');
      } else {
        const rawApiKey = randomBytes(32).toString('hex');
        const apiKeyHash = createHash('sha256').update(rawApiKey).digest('hex');
        const key = await lastValueFrom(
          this.apiKeyDbService.createApiKey({
            apiKey: {
              hash: apiKeyHash,
              description: request.description,
              scopes: [ApiKeyProto.ApiScope.FULL],
              project: {
                name: request.projectName,
              },
            },
          }),
        );
        if (!key) {
          throw new Error('Failed to create API key');
        }
        return {
          apiKey: key,
        };
      }
    } catch (e) {
      throw e; // handle
    }
  }
  async revokeApiKey(
    request: ApiKeyProto.RevokeApiKeyRequest,
  ): Promise<ApiKeyProto.RevokeApiKeyResponse> {
    console.log(`request: ${request}`);
    throw new Error('Method not implemented.');
  }
}
