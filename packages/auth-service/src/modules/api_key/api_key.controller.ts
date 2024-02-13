import { Controller, Inject } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { ApiKeyProto, UserProto, ProjectProto } from 'juno-proto';
import { Observable, lastValueFrom } from 'rxjs';
import bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';

@Controller('api_key')
@ApiKeyProto.ApiKeyServiceControllerMethods()
export class ApiKeyController implements ApiKeyProto.ApiKeyServiceController {
  private projectService: ProjectProto.ProjectServiceClient;
  private userService: UserProto.UserServiceClient;
  private apiKeyService: ApiKeyProto.ApiKeyServiceClient;

  constructor(
    @Inject(ProjectProto.PROJECT_SERVICE_NAME) private dbClient: ClientGrpc,
  ) {}

  onModuleInit() {
    this.projectService =
      this.dbClient.getService<ProjectProto.ProjectServiceClient>(
        ProjectProto.PROJECT_SERVICE_NAME,
      );
    this.userService = this.dbClient.getService<UserProto.UserServiceClient>(
      UserProto.USER_SERVICE_NAME,
    );
    this.apiKeyService =
      this.dbClient.getService<ApiKeyProto.ApiKeyServiceClient>(
        ApiKeyProto.API_KEY_SERVICE_NAME,
      );
  }

  async issueApiKey(
    request: ApiKeyProto.IssueApiKeyRequest,
  ): Promise<ApiKeyProto.IssueApiKeyResponse> {
    const password: Observable<UserProto.UserPassword> =
      this.userService.getUserPassword({
        email: request.email,
      });

    try {
      const hash = await bcrypt.hash(request.password, 10);
      const passwordEquals = bcrypt.compare(
        hash,
        (await lastValueFrom(password)).password,
      );
      if (!passwordEquals) {
        // handle
      } else {
        const apiKey = randomBytes(20).toString('hex'); // temporary, use UUIDv7
        const key = await lastValueFrom(
          this.apiKeyService.createApiKey({
            uuid: apiKey,
            environment: request.environment,
            description: request.description,
            userVisible: request.userVisible,
            scopes: [ApiKeyProto.ApiScopes.FULL],
            project: {
              name: request.projectName,
            },
          }),
        );
        if (!key) {
          throw new Error('Failed to create API key');
        }
        return {
          apiKey,
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

  async createApiKey(
    request: ApiKeyProto.CreateApiKeyParams,
  ): Promise<ApiKeyProto.ApiKey> {
    return request.apiKey;
  }
}
