import { Controller, Inject, Post } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { API_KEY_SERVICE_NAME, ApiKeyServiceClient } from 'src/gen/api_key';
import {
  CreateJwtRequest,
  CreateJwtResponse,
  JWT_SERVICE_NAME,
  JwtServiceController,
  JwtServiceControllerMethods,
  ValidateJwtRequest,
  ValidateJwtResponse,
} from 'src/gen/jwt';

@Controller('jwt')
@JwtServiceControllerMethods()
export class JWTController implements JwtServiceController {
  private apiKeyService: ApiKeyServiceClient;

  constructor(private apiKeyClient: ClientGrpc) {
    this.apiKeyService = apiKeyClient.getService<ApiKeyServiceClient>(API_KEY_SERVICE_NAME);
  }

  @Post('authorize')
  async createJwt(request: CreateJwtRequest): Promise<CreateJwtResponse> {
    const { header } = request;
    const apiKey = header.XApiKey;

    if (!this.apiKeyService.isValidApiKey(apiKey)) {
      return {
        success: false,
        error: "Provided API key is not valid"
      }
    }

    return
  }
  validateJwt(request: ValidateJwtRequest): Promise<ValidateJwtResponse> {
    console.log(`request: ${request}`);
    throw new Error('Method not implemented.');
  }
}
