import {
  Injectable,
  NestMiddleware,
  Inject,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ClientGrpc } from '@nestjs/microservices';
import { ApiKeyProto, JwtProto, AuthCommonProto } from 'juno-proto';
import { lastValueFrom } from 'rxjs';

const { API_KEY_SERVICE_NAME } = ApiKeyProto;
const { JWT_SERVICE_NAME } = JwtProto;

@Injectable()
export class ApiKeyMiddleware implements NestMiddleware, OnModuleInit {
  private apiKeyService: ApiKeyProto.ApiKeyServiceClient;
  private jwtService: JwtProto.JwtServiceClient;

  constructor(
    @Inject(API_KEY_SERVICE_NAME) private apiKeyClient: ClientGrpc,
    @Inject(JWT_SERVICE_NAME) private jwtClient: ClientGrpc,
  ) {}

  onModuleInit() {
    this.apiKeyService =
      this.apiKeyClient.getService<ApiKeyProto.ApiKeyServiceClient>(
        ApiKeyProto.API_KEY_SERVICE_NAME,
      );
    this.jwtService = this.jwtClient.getService<JwtProto.JwtServiceClient>(
      JwtProto.JWT_SERVICE_NAME,
    );
  }

  async use(req: ApiKeyReq, res: Response, next: NextFunction) {
    console.log('ApiKeyMiddleware - Processing request:', req.path);
    console.log(
      'ApiKeyMiddleware - Authorization header:',
      req.headers.authorization,
    );

    if (
      req.headers.authorization === undefined ||
      req.headers.authorization.length === 0
    ) {
      console.log('ApiKeyMiddleware - No authorization headers');
      throw new UnauthorizedException('No authorization headers');
    }

    const token = this.extractTokenFromHeader(req);
    if (!token) {
      console.log('ApiKeyMiddleware - No bearer token found');
      throw new UnauthorizedException('Bearer token not found');
    }

    console.log(
      'ApiKeyMiddleware - Extracted token:',
      token.substring(0, 10) + '...',
    );

    // Try API key validation first
    try {
      const apiKeyValidation = this.apiKeyService.validateApiKey({
        apiKey: token,
      });
      const res = await lastValueFrom(apiKeyValidation);
      console.log('ApiKeyMiddleware - API key validation success:', res.key);
      req.apiKey = res.key;
      next();
    } catch (error) {
      console.log(
        'ApiKeyMiddleware - API key validation failed, trying JWT:',
        error.message,
      );
      // API key validation failed, try JWT validation
      try {
        const jwtValidation = this.jwtService.validateApiKeyJwt({ jwt: token });
        const jwtRes = await lastValueFrom(jwtValidation);

        if (!jwtRes.valid || !jwtRes.apiKey) {
          throw new UnauthorizedException('Invalid JWT token');
        }

        console.log(
          'ApiKeyMiddleware - JWT validation success:',
          jwtRes.apiKey,
        );
        req.apiKey = jwtRes.apiKey;
        next();
      } catch (error) {
        console.error(
          'ApiKeyMiddleware - Both API key and JWT validation failed:',
          error,
        );
        throw new UnauthorizedException('Invalid authentication token');
      }
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
type ApiKeyReq = Request & {
  apiKey: AuthCommonProto.ApiKey;
};
