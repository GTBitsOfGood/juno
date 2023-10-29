import {
  Controller,
  Inject,
  OnModuleInit,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
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

  async validateJwt(request: ValidateJwtRequest): Promise<ValidateJwtResponse> {
    const { header } = request;
    const authorization = header.authorization.split(' ');

    if (
      !authorization ||
      authorization[0] !== 'Bearer' ||
      authorization.length !== 2
    ) {
      throw new UnauthorizedException('Invalid Authorization Header');
    }
    const { verified, hashedApiKey } = this.jwtService.verifyJwt({
      jwt: authorization[1],
    });
    const { validHash } = await lastValueFrom(
      this.apiKeyService.validateHashedApiKey({ hashedApiKey }),
    );
    return {
      success: true,
      verified: verified && validHash,
    };
  }
}
