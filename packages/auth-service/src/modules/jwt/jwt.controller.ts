import { Controller, Inject, OnModuleInit, Post } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import {
  API_KEY_SERVICE_NAME,
  ApiKeyServiceClient,
  GetProjectByApiKeyResponse,
} from 'src/gen/api_key';
import {
  CreateJwtRequest,
  CreateJwtResponse,
  JwtServiceController,
  JwtServiceControllerMethods,
  ValidateJwtRequest,
  ValidateJwtResponse,
} from 'src/gen/jwt';
import { JWTService } from './jwt.service';
import { lastValueFrom } from 'rxjs';

@Controller('jwt')
@JwtServiceControllerMethods()
export class JWTController implements JwtServiceController, OnModuleInit {
  private apiKeyService: ApiKeyServiceClient;

  constructor(
    private readonly jwtService: JWTService,
    @Inject(API_KEY_SERVICE_NAME) private apiKeyClient: ClientGrpc,
  ) {}

  onModuleInit() {
    this.apiKeyService =
      this.apiKeyClient.getService<ApiKeyServiceClient>(API_KEY_SERVICE_NAME);
  }

  @Post('authorize')
  async createJwt(request: CreateJwtRequest): Promise<CreateJwtResponse> {
    const { header } = request;
    const apiKey = header.XApiKey;

    const project: GetProjectByApiKeyResponse = await lastValueFrom(
      this.apiKeyService.getProjectByApiKey({ apiKey }),
    );

    if (project.success) {
      return {
        success: false,
        error: 'Provided API key is not valid',
      };
    }

    const { hashedApiKey } = await lastValueFrom(
      this.apiKeyService.getHashedApiKey({ apiKey }),
    );

    const { jwt } = this.jwtService.createJwtFromProjectInfo({
      projectId: project.projectId,
      scopes: project.scopes,
      hashedApiKey,
    });

    return {
      success: true,
      jwt,
    };
  }
  validateJwt(request: ValidateJwtRequest): Promise<ValidateJwtResponse> {
    console.log(`request: ${request}`);
    throw new Error('Method not implemented.');
  }
}
