import { Controller, Inject } from '@nestjs/common';
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
    const requiredFields = ['projectName', 'email', 'password'];
    const missingArgs = requiredFields.filter((field) => !request[field]);
    if (missingArgs.length) {
      throw new MissingRequestBodyException(missingArgs);
    }

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
        const key = await lastValueFrom(
          this.apiKeyService.createApiKey({
            // Need to add creation in db
            scopes: [ApiScopes.FULL],
          }),
        );
        await lastValueFrom(
          this.projectService.linkApiKey({
            project: { name: request.projectName },
            apiKey: { hash: key.apiKey },
          }),
        );
        return key;
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
