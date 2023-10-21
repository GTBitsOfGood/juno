import { Controller, Get, Inject, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import {
  API_KEY_SERVICE_NAME,
  ApiKeyServiceClient,
} from 'src/auth-service/gen/api_key';
import { JWT_SERVICE_NAME, JwtServiceClient } from 'src/auth-service/gen/jwt';

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
    this.apiKeyService.issueApiKey({}).subscribe();
  }
}
