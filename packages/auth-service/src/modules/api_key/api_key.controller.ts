import { Controller, Inject, Param } from '@nestjs/common';
import { MissingRequestBodyException } from '@utils/errors';

import {
  ApiKeyServiceController,
  ApiKeyServiceControllerMethods,
  IssueApiKeyRequest,
  IssueApiKeyResponse,
  RevokeApiKeyRequest,
  RevokeApiKeyResponse,
} from 'src/gen/api_key';

import {
  ProjectServiceClient,
  PROJECT_SERVICE_NAME,
} from 'src/db-service/gen/project';
import { ClientGrpc } from '@nestjs/microservices';
import { Observable, lastValueFrom } from 'rxjs';
import { UserPassword, UserServiceClient } from 'src/db-service/gen/user';
import { USER_SERVICE_NAME } from 'src/gen/user';
import bcrypt from 'bcrypt';
import {
  API_KEY_SERVICE_NAME,
  ApiKeyServiceClient,
  ApiScopes,
} from 'src/db-service/gen/api_key';
import { randomBytes } from 'crypto';

@Controller('api_key')
@ApiKeyServiceControllerMethods()
export class ApiKeyController implements ApiKeyServiceController {
  private projectService: ProjectServiceClient;
  private userService: UserServiceClient;
  private apiKeyService: ApiKeyServiceClient;

  constructor(@Inject(PROJECT_SERVICE_NAME) private dbClient: ClientGrpc) {}

  onModuleInit() {
    this.projectService =
      this.dbClient.getService<ProjectServiceClient>(PROJECT_SERVICE_NAME);
    this.userService =
      this.dbClient.getService<UserServiceClient>(USER_SERVICE_NAME);
    this.apiKeyService =
      this.dbClient.getService<ApiKeyServiceClient>(API_KEY_SERVICE_NAME);
  }

  async issueApiKey(request: IssueApiKeyRequest): Promise<IssueApiKeyResponse> {
    const password: Observable<UserPassword> = this.userService.getUserPassword(
      {
        email: request.email,
      },
    );

    try {
      const hash = await bcrypt.hash(request.password, 10);
      const passwordEquals = bcrypt.compare(
        hash,
        (await lastValueFrom(password)).password,
      );
      if (!passwordEquals) {
        // handle
      } else {
        const apiKey = randomBytes(20).toString('hex');
        const apiKeyHash = await bcrypt.hash(apiKey, 10);
        const key = await lastValueFrom(
          this.apiKeyService.createApiKey({
            hash: apiKeyHash,
            environment: request.environment,
            description: request.description,
            userVisible: request.userVisible,
            scopes: [ApiScopes.FULL],
            project: {
              name: request.projectName,
            },
          }),
        );
        return {
          apiKey,
        };
      }
    } catch (e) {
      throw e; // handle
    }
  }
  async revokeApiKey(
    request: RevokeApiKeyRequest,
  ): Promise<RevokeApiKeyResponse> {
    console.log(`request: ${request}`);
    throw new Error('Method not implemented.');
  }
}
