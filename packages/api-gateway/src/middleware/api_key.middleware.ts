import {
  Injectable,
  Logger,
  NestMiddleware,
  Inject,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ClientGrpc } from '@nestjs/microservices';
import {
  ApiKeyProto,
  JwtProto,
  AuthCommonProto,
  CommonProto,
} from 'juno-proto';
import { lastValueFrom } from 'rxjs';

const { API_KEY_SERVICE_NAME } = ApiKeyProto;
const { JWT_SERVICE_NAME } = JwtProto;

@Injectable()
export class ApiKeyMiddleware implements NestMiddleware, OnModuleInit {
  private readonly logger = new Logger(ApiKeyMiddleware.name);
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
    if (
      req.headers.authorization === undefined ||
      req.headers.authorization.length === 0
    ) {
      throw new UnauthorizedException('No authorization headers');
    }

    const token = this.extractTokenFromHeader(req);
    if (!token) {
      throw new UnauthorizedException('Bearer token not found');
    }

    // Try API key validation first
    try {
      const apiKeyValidation = this.apiKeyService.validateApiKey({
        apiKey: token,
      });
      const res = await lastValueFrom(apiKeyValidation);
      req.apiKey = res.key;

      await this.resolveUserFromJwt(req);

      next();
    } catch (error) {
      // API key validation failed, try JWT validation
      try {
        const jwtValidation = this.jwtService.validateApiKeyJwt({ jwt: token });
        const jwtRes = await lastValueFrom(jwtValidation);

        if (!jwtRes.valid || !jwtRes.apiKey) {
          throw new UnauthorizedException('Invalid JWT token');
        }

        req.apiKey = jwtRes.apiKey;

        await this.resolveUserFromJwt(req);

        next();
      } catch (error) {
        throw new UnauthorizedException('Invalid authentication token');
      }
    }
  }

  private async resolveUserFromJwt(req: ApiKeyReq): Promise<void> {
    const userJwt = req.headers['x-user-jwt'] as string | undefined;
    if (!userJwt) return;

    try {
      const result = await lastValueFrom(
        this.jwtService.validateUserJwt({ jwt: userJwt }),
      );
      if (result.valid && result.user) {
        req.user = result.user;
      }
    } catch (error) {
      this.logger.warn(
        `x-user-jwt validation failed: ${(error as Error).message}`,
      );
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
type ApiKeyReq = Request & {
  apiKey: AuthCommonProto.ApiKey;
  user?: CommonProto.User;
};
