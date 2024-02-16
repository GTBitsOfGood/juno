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
    const prepareCreateApiKey = {
      ...request.apiKey,
      scopes: request.apiKey.scopes.map((scope) => ApiScope[scope]),
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
