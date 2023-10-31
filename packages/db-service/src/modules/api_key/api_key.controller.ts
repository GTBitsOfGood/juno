import { Controller } from '@nestjs/common';
import {
  ApiKey,
  ApiKeyServiceController,
  ApiKeyServiceControllerMethods,
  CreateApiKeyParams,
} from 'src/gen/api_key';
import { ApiKeyService } from './api_key.service';
import { randomBytes } from 'crypto';

@Controller('api-key')
@ApiKeyServiceControllerMethods()
export class ApiKeyController implements ApiKeyServiceController {
  constructor(private readonly apiKeyService: ApiKeyService) {}

  async createApiKey(request: CreateApiKeyParams): Promise<ApiKey> {
    return { apiKey: randomBytes(20).toString('hex'), scopes: request.scopes };
  }
}
