import { Controller } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiKeyProto } from 'juno-proto';
import { ApiScope } from '@prisma/client';

@Controller()
@ApiKeyProto.ApiKeyDbServiceControllerMethods()
export class ApiKeyDbController
  implements ApiKeyProto.ApiKeyDbServiceController
{
  constructor(private readonly apiKeyService: AuthService) {}

  async createApiKey(
    request: ApiKeyProto.CreateApiKeyParams,
  ): Promise<ApiKeyProto.ApiKey> {
    if (!request.apiKey.description) {
      throw new Error('missing description to create api key');
    } else if (!request.apiKey.hash) {
      throw new Error('missing hash to create api key');
    } else if (!request.apiKey.project) {
      throw new Error('missing project to create api key');
    } else if (!request.apiKey.scopes) {
      throw new Error('missing scopes to create api key');
    }

    const prepareCreateApiKey = {
      ...request.apiKey,
      // scopes: request.apiKey.scopes?.map((scope) => ApiScope[scope]),
      scopes: [],
      project: {
        connect: {
          id: request.apiKey.project.id,
          name: request.apiKey.project.name,
        },
      },
    };

    const apiKey = this.apiKeyService.createApiKey(prepareCreateApiKey);
    return apiKey;
  }
}
