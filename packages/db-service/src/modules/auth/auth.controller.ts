import { Controller } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiKeyProto } from 'juno-proto';
import { ApiKeyIdentifier } from 'juno-proto/dist/gen/identifiers';
import { validateApiKeydentifier } from 'src/utility/validate';

@Controller()
@ApiKeyProto.ApiKeyDbServiceControllerMethods()
export class ApiKeyDbController
  implements ApiKeyProto.ApiKeyDbServiceController
{
  constructor(private readonly apiKeyService: AuthService) {}

  getApiKey(request: ApiKeyIdentifier): Promise<ApiKeyProto.ApiKey> {
    return this.apiKeyService.findApiKey(validateApiKeydentifier(request));
  }

  async createApiKey(
    request: ApiKeyProto.CreateApiKeyParams,
  ): Promise<ApiKeyProto.ApiKey> {
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
      environment: request.apiKey.environment,
    };

    const apiKey = this.apiKeyService.createApiKey(prepareCreateApiKey);
    return apiKey;
  }
}
