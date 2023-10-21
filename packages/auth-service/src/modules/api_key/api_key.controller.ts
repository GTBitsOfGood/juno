import { Controller } from '@nestjs/common';
import {
  ApiKeyServiceController,
  ApiKeyServiceControllerMethods,
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
}
