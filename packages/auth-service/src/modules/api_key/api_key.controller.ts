import { Controller } from '@nestjs/common';
import { ApiKeyProto } from 'juno-proto';

@Controller('api_key')
@ApiKeyProto.ApiKeyServiceControllerMethods()
export class ApiKeyController implements ApiKeyProto.ApiKeyServiceController {
  async issueApiKey(
    request: ApiKeyProto.IssueApiKeyRequest,
  ): Promise<ApiKeyProto.IssueApiKeyResponse> {
    console.log(`request: ${request}`);
    return {};
  }
  revokeApiKey(
    request: ApiKeyProto.RevokeApiKeyRequest,
  ): Promise<ApiKeyProto.RevokeApiKeyResponse> {
    console.log(`request: ${request}`);
    throw new Error('Method not implemented.');
  }
}
