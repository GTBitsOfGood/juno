import { Controller, Inject } from '@nestjs/common';
import { JwtProto, ApiKeyProto } from 'juno-proto';
import * as jwt from 'jsonwebtoken';
import { ClientGrpc } from '@nestjs/microservices';
import { createHash } from 'crypto';
import { lastValueFrom } from 'rxjs';

@Controller('jwt')
@JwtProto.JwtServiceControllerMethods()
export class JWTController implements JwtProto.JwtServiceController {
  private apiKeyDbService: ApiKeyProto.ApiKeyDbServiceClient;

  constructor(
    @Inject(ApiKeyProto.API_KEY_DB_SERVICE_NAME)
    private apiKeyClient: ClientGrpc,
  ) { }

  onModuleInit() {
    this.apiKeyDbService =
      this.apiKeyClient.getService<ApiKeyProto.ApiKeyDbServiceClient>(
        ApiKeyProto.API_KEY_DB_SERVICE_NAME,
      );
  }
  async createJwt(
    request: JwtProto.CreateJwtRequest,
  ): Promise<JwtProto.CreateJwtResponse> {
    const apiKeyHash = createHash('sha256')
      .update(request.apiKey)
      .digest('hex');
    const apiKey = await lastValueFrom(
      this.apiKeyDbService.getApiKey({
        hash: apiKeyHash,
      }),
    );

    if (!apiKey) {
      throw new Error('Invalid API Key');
    }

    const token = jwt.sign(
      {
        apiKeyHash: apiKeyHash,
      },
      process.env.JWT_SECRET ?? 'secret',
    );

    return { jwt: token };
  }
  async validateJwt(
    request: JwtProto.ValidateJwtRequest,
  ): Promise<JwtProto.ValidateJwtResponse> {
    // rough implementation for middleware testing, please delete if unused
    try {
      const { apiKeyHash } = <jwt.ApiKeyHashJWTPayload>(
        jwt.verify(request.jwt, process.env.JWT_SECRET ?? 'secret')
      );
      const apiKey = await lastValueFrom(
        this.apiKeyDbService.getApiKey({
          hash: apiKeyHash,
        }),
      );

      if (apiKey) {
        return { valid: true };
      }
      return { valid: false };
    } catch (e) {
      throw new Error(e.message);
    }
  }
}
