import { Body, Controller, Post } from '@nestjs/common';
import { ApiKeyProto } from 'juno-proto';
import { OptionalAPIKeyResponse, RevokeAPIKeyBody } from 'src/models/api_key';

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
  @Post('/api/auth/keys/revoke')
  async revokeKeys(
    @Body() params: RevokeAPIKeyBody,
  ): Promise<OptionalAPIKeyResponse | ''> {
    const err: OptionalAPIKeyResponse = { error: '' };
    if (!params.apiKey && !params.projectName) {
      err.error = 'Incorrect body';
      return err;
    }
    this.revokeApiKey;
    return '';
  }
}
