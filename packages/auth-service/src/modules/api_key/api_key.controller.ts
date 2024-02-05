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
  private projectService: ApiKeyProto.ApiKeyServiceClient;

  async issueApiKey(
    request: ApiKeyProto.IssueApiKeyRequest,
  ): Promise<ApiKeyProto.IssueApiKeyResponse> {
    console.log(`request: ${request}`);
    return {};
  }
  async revokeApiKey(
    request: ApiKeyProto.RevokeApiKeyRequest,
  ): Promise<ApiKeyProto.RevokeApiKeyResponse> {
    this.projectService.revokeApiKey(request);
    return {};
  }
  @Post('/api/auth/keys/revoke')
  async revokeKeys(@Body() params: RevokeAPIKeyBody): Promise<any> {
    if (!params.hash && !params.projectName) {
      throw new HttpException('Incorrect body', HttpStatus.BAD_REQUEST);
    }
    await this.revokeApiKey(params);
    return {};
  }
}
