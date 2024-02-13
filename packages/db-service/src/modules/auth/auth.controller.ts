import { Controller } from '@nestjs/common';
import { ApiKey } from '@prisma/client';
import { AuthService } from './auth.service';
import { ApiKeyProto } from 'juno-proto';

@Controller()
@ApiKeyProto.ApiKeyServiceControllerMethods()
export class ApiKeyController implements ApiKeyProto.ApiKeyServiceController {
  constructor(private readonly apiKeyService: AuthService) {}

  async createApiKey(request: ApiKeyProto.CreateApiKeyParams): Promise<ApiKey> {
    // const apiKey = await this.apiKeyService.createApiKey(request.apiKey);
    const apiKey = this.apiKeyService.createApiKey(request);
    return apiKey;
  }
}
