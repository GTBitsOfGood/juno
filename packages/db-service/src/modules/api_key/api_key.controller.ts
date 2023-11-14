import { Controller } from '@nestjs/common';
import {
  ApiKey,
  ApiKeyServiceController,
  ApiKeyServiceControllerMethods,
  ApiScopes,
  CreateApiKeyParams,
} from 'src/gen/api_key';
import { ApiKeyService } from './api_key.service';
import { Scope } from '@prisma/client';
import { randomBytes } from 'crypto';
import { ApiKeyIdentifier } from 'src/gen/shared/identifiers';
import {
  validateApiKeyIdentifier,
  validateProjectIdentifier,
} from 'src/utility/validate';

@Controller('api-key')
@ApiKeyServiceControllerMethods()
export class ApiKeyController implements ApiKeyServiceController {
  constructor(private readonly apiKeyService: ApiKeyService) {}

  private mapPrismaScopeToRPC(role: Scope): ApiScopes {
    switch (role) {
      case Scope.FULL:
        return ApiScopes.FULL;
      default:
        return ApiScopes.UNRECOGNIZED;
    }
  }

  private mapRPCScopeToPrisma(role: ApiScopes): Scope {
    switch (role) {
      case ApiScopes.FULL:
        return Scope.FULL;
      default:
        return Scope.FULL;
    }
  }

  async getApiKey(identifier: ApiKeyIdentifier): Promise<ApiKey> {
    const params = validateApiKeyIdentifier(identifier);
    const apiKey = await this.apiKeyService.apiKey(params);
    return {
      ...apiKey,
      scopes: apiKey.scopes.map(this.mapPrismaScopeToRPC),
    };
  }

  async createApiKey(request: CreateApiKeyParams): Promise<ApiKey> {
    const encoded = randomBytes(20).toString('hex');
    const apiKey = await this.apiKeyService.createApiKey({
      hash: encoded,
      description: request.description,
      userVisible: request.userVisible,
      environment: request.environment,
      project: {
        connect: validateProjectIdentifier(request.project),
      },
    });
    return {
      ...apiKey,
      scopes: apiKey.scopes.map(this.mapPrismaScopeToRPC),
    };
  }

  async deleteApiKey(identifier: ApiKeyIdentifier): Promise<ApiKey> {
    const apiKeyId = validateApiKeyIdentifier(identifier);
    const apiKey = await this.apiKeyService.deleteApiKey(apiKeyId);
    return {
      ...apiKey,
      scopes: apiKey.scopes.map(this.mapPrismaScopeToRPC),
    };
  }
}
