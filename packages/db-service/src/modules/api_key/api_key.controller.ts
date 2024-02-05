import { Controller } from '@nestjs/common';
import { ApiKeyProto, IdentifierProto } from 'juno-proto';
import { Observable } from 'rxjs';
import { ApiKeyService } from './api_key.service';
import { validateApiKeyIdentifier } from 'src/utility/validate';
import { ApiKey } from '@prisma/client';

@Controller()
@ApiKeyProto.ApiKeyServiceControllerMethods()
export class ApiKeyController implements ApiKeyProto.ApiKeyServiceController {
  constructor(private readonly apiKeyService: ApiKeyService) {}
  async issueApiKey(request: ApiKeyProto.IssueApiKeyRequest): Promise<ApiKey> {
    const project = await this.apiKeyService.createApiKey({
      hash: request.hash,
      description: request.description,
      userVisible: request.userVisible,
      project: undefined,
    });
    return project;
  }
  async revokeApiKey(
    identifier: IdentifierProto.ApiKeyIdentifier,
  ): Promise<ApiKeyProto.RevokeApiKeyResponse> {
    // different structure than previous validation methods because projectName isn't within Prisma.ApiKeyWhereUniqueInput
    const { projectName, hash } = validateApiKeyIdentifier(identifier);
    if (!projectName) {
      return this.apiKeyService.deleteApiKey({ hash });
    }
    return this.apiKeyService.deleteAllProjectApiKeys(projectName);
  }
}
