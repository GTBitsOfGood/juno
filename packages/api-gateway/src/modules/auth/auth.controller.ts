import {
  Body,
  Controller,
  Get,
  Inject,
  OnModuleInit,
  Post,
} from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { ApiKeyProto, JwtProto } from 'juno-proto';
import {
  ApiKeyServiceClient,
  IssueApiKeyRequest,
} from 'juno-proto/dist/gen/api_key';
import { JwtServiceClient } from 'juno-proto/dist/gen/jwt';

const { JWT_SERVICE_NAME } = JwtProto;
const { API_KEY_SERVICE_NAME } = ApiKeyProto;

@Controller('auth')
export class AuthController implements OnModuleInit {
  private jwtService: JwtServiceClient;
  private apiKeyService: ApiKeyServiceClient;

  constructor(
    @Inject(JWT_SERVICE_NAME) private jwtClient: ClientGrpc,
    @Inject(API_KEY_SERVICE_NAME) private apiClient: ClientGrpc,
  ) { }

  onModuleInit() {
    this.jwtService =
      this.jwtClient.getService<JwtServiceClient>(JWT_SERVICE_NAME);
    this.apiKeyService =
      this.apiClient.getService<ApiKeyServiceClient>(API_KEY_SERVICE_NAME);
  }

  @Get()
  getJWT() {
    console.log('CALLED');
    // this.apiKeyService.issueApiKey({}).subscribe();
    return 'test';
  }

  @Post('/key')
  createApiKey(@Body() issueApiKeyRequest: IssueApiKeyRequest) {
    this.apiKeyService.issueApiKey(issueApiKeyRequest).subscribe();
  }
}
