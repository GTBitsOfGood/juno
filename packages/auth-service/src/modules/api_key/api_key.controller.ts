import { Controller } from '@nestjs/common';
import {
  ApiKeyServiceController,
  ApiKeyServiceControllerMethods,
  GetHashedApiKeyRequest,
  GetHashedApiKeyResponse,
  GetProjectByApiKeyRequest,
  GetProjectByApiKeyResponse,
  IssueApiKeyRequest,
  IssueApiKeyResponse,
  RevokeApiKeyRequest,
  RevokeApiKeyResponse,
} from 'src/gen/api_key';

@Controller('api_key')
@ApiKeyServiceControllerMethods()
export class ApiKeyController implements ApiKeyServiceController {
  async issueApiKey(request: IssueApiKeyRequest): Promise<IssueApiKeyResponse> {
    console.log(`request: ${request}`);
    return {};
  }
  revokeApiKey(request: RevokeApiKeyRequest): Promise<RevokeApiKeyResponse> {
    console.log(`request: ${request}`);
    throw new Error('Method not implemented.');
  }

  async getProjectByApiKey(
    request: GetProjectByApiKeyRequest,
  ): Promise<GetProjectByApiKeyResponse> {
    const apiKey = request.apiKey;

    return {
      success: false,
      projectId: null,
      scopes: [],
      error: `Failed to retrieve project with api key ${apiKey}`,
    };
  }

  async getHashedApiKey(
    request: GetHashedApiKeyRequest,
  ): Promise<GetHashedApiKeyResponse> {
    return {
      success: true,
      hashedApiKey: request.apiKey,
    };
  }
}
