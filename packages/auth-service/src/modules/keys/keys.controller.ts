import { Controller } from '@nestjs/common';
import {
  APIKeyServiceController,
  IssueAPIKeyRequest,
  IssueAPIKeyResponse,
  RevokeAPIKeyRequest,
  RevokeAPIKeyResponse,
} from 'src/gen/api_key';

@Controller('keys')
export class KeysController implements APIKeyServiceController {
  issueApiKey(request: IssueAPIKeyRequest): Promise<IssueAPIKeyResponse> {
    console.log(`request: ${request}`);
    throw new Error('Method not implemented.');
  }
  revokeApiKey(request: RevokeAPIKeyRequest): Promise<RevokeAPIKeyResponse> {
    console.log(`request: ${request}`);
    throw new Error('Method not implemented.');
  }
}
