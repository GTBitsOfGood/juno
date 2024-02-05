import {
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { ApiKeyProto } from 'juno-proto';
import { RevokeAPIKeyBody } from 'src/models/api_key';

@Controller('api_key')
@ApiKeyProto.ApiKeyServiceControllerMethods()
export class ApiKeyController implements ApiKeyProto.ApiKeyServiceController {
  private apiKeyService: ApiKeyProto.ApiKeyServiceClient;

  async issueApiKey(
    request: ApiKeyProto.IssueApiKeyRequest,
  ): Promise<ApiKeyProto.IssueApiKeyResponse> {
    console.log(`request: ${request}`);
    return {};
  }

  async revokeApiKey(
    request: ApiKeyProto.RevokeApiKeyRequest,
  ): Promise<ApiKeyProto.RevokeApiKeyResponse> {
    this.apiKeyService.revokeApiKey(request);
    return {};
  }

  @Post('/api/auth/keys/revoke')
  async revokeKeys(@Body() params: RevokeAPIKeyBody): Promise<any> {
    if (
      (!params?.hash && !params?.projectName) ||
      (params?.projectName && params?.hash)
    ) {
      throw new HttpException('Incorrect body', HttpStatus.BAD_REQUEST);
    }
    await this.revokeApiKey(params);
    return {};
  }
}
