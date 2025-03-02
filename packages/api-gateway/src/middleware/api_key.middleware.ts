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
// import { ApiKey } from 'juno-proto/dist/gen/auth_common';

const { API_KEY_SERVICE_NAME } = ApiKeyProto;
const { JWT_SERVICE_NAME } = JwtProto;

// interface ApiKeyReq extends Request {
//   apiKey?: ApiKey;
// }

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

    try {
      // Try API key validation first
      try {
        const apiKeyValidation = this.apiKeyService.validateApiKey({
          apiKey: token,
        });
        const res = await lastValueFrom(apiKeyValidation);
        req.apiKey = res.key;
        next();
        return;
      } catch (error) {
        // API key validation failed, try JWT validation
        const jwtValidation = this.jwtService.validateJwt({ jwt: token });
        await lastValueFrom(jwtValidation);
        next();
        return;
      }
    } catch (error) {
      throw new UnauthorizedException('Invalid authentication token');
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
