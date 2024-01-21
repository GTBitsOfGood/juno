import { Controller, Get, Inject, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { ApiKeyProto, JwtProto } from 'juno-proto';

const { JWT_SERVICE_NAME } = JwtProto;
const { API_KEY_SERVICE_NAME } = ApiKeyProto;

@Controller('auth')
export class AuthController implements OnModuleInit {
  private jwtService: JwtProto.JwtServiceClient;
  private apiKeyService: ApiKeyProto.ApiKeyServiceClient;

  constructor(
    @Inject(JWT_SERVICE_NAME) private jwtClient: ClientGrpc,
    @Inject(API_KEY_SERVICE_NAME) private apiClient: ClientGrpc,
  ) {}

  onModuleInit() {
    this.jwtService =
      this.jwtClient.getService<JwtProto.JwtServiceClient>(JWT_SERVICE_NAME);
    this.apiKeyService =
      this.apiClient.getService<ApiKeyProto.ApiKeyServiceClient>(
        ApiKeyProto.API_KEY_SERVICE_NAME,
      );
  }

  @Get()
  getJWT() {
    console.log('CALLED');
    this.apiKeyService.issueApiKey({}).subscribe();
  }
}
