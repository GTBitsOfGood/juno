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
  Project,
} from 'src/db-service/gen/project';
import { ClientGrpc } from '@nestjs/microservices';
import { Observable } from 'rxjs';

@Controller('api_key')
@ApiKeyServiceControllerMethods()
export class ApiKeyController implements ApiKeyServiceController {
  private dbService: ProjectServiceClient;

  constructor(@Inject(PROJECT_SERVICE_NAME) private dbClient: ClientGrpc) {}

  onModuleInit() {
    this.dbService =
      this.dbClient.getService<ProjectServiceClient>(PROJECT_SERVICE_NAME);
  }

  async issueApiKey(request: IssueApiKeyRequest): Promise<IssueApiKeyResponse> {
    const requiredFields = ['projectName', 'email', 'password'];
    console.log('???');
    const missingArgs = requiredFields.filter((field) => !request[field]);
    if (missingArgs.length) {
      throw new MissingRequestBodyException(missingArgs);
    }

    const project: Observable<Project> = await this.dbClient.getService(
      request.projectName,
    );
    project.subscribe();

    console.log(project);

    // check stored password hash, if correct, generate api key and return it
    // api key should be hashed and stored
    // will require createApiKey method in DBService, and proto def in DbService
    // return api key if successful and error message if not
    return {};
  }
  async revokeApiKey(
    request: RevokeApiKeyRequest,
  ): Promise<RevokeApiKeyResponse> {
    console.log(`request: ${request}`);
    throw new Error('Method not implemented.');
  }
}
