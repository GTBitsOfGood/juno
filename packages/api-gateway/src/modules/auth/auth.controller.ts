import {
  Body,
  Controller,
  Get,
  Inject,
  OnModuleInit,
  Post,
} from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiCreatedResponse,
} from '@nestjs/swagger';
import { ApiKeyProto, JwtProto } from 'juno-proto';
import { ApiKeyServiceClient } from 'juno-proto/dist/gen/api_key';
import { JwtServiceClient } from 'juno-proto/dist/gen/jwt';
import { lastValueFrom } from 'rxjs';
import { IssueApiKeyRequest, IssueApiKeyResponse } from 'src/models/auth';

const { JWT_SERVICE_NAME } = JwtProto;
const { API_KEY_SERVICE_NAME } = ApiKeyProto;

@Controller('auth')
export class AuthController implements OnModuleInit {
  private jwtService: JwtServiceClient;
  private apiKeyService: ApiKeyServiceClient;

  constructor(
    @Inject(JWT_SERVICE_NAME) private jwtClient: ClientGrpc,
    @Inject(API_KEY_SERVICE_NAME) private apiClient: ClientGrpc,
  ) {}

  onModuleInit() {
    this.jwtService =
      this.jwtClient.getService<JwtServiceClient>(JWT_SERVICE_NAME);
    this.apiKeyService =
      this.apiClient.getService<ApiKeyServiceClient>(API_KEY_SERVICE_NAME);
  }

  @Get()
  @ApiBearerAuth()
  getJWT() {
    console.log('CALLED');
    // this.apiKeyService.issueApiKey({}).subscribe();
    return 'test';
  }

  @ApiOperation({
    description:
      'Thie endpoint issues a new API key for the project tied to the specified environment.',
  })
  @ApiCreatedResponse({
    description: 'The API Key has been successfully created',
    type: IssueApiKeyResponse,
  })
  @Post('/key')
  async createApiKey(@Body() issueApiKeyRequest: IssueApiKeyRequest) {
    const obs = this.apiKeyService.issueApiKey({
      email: issueApiKeyRequest.email,
      password: issueApiKeyRequest.password,
      description: issueApiKeyRequest.description,
      environment: issueApiKeyRequest.environment,
      project: issueApiKeyRequest.project,
    });

    return new IssueApiKeyResponse(await lastValueFrom(obs));
  }
}
