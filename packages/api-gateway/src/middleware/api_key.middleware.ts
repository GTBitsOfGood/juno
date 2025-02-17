import {
  Injectable,
  NestMiddleware,
  Inject,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ClientGrpc } from '@nestjs/microservices';
import { ApiKeyProto, AuthCommonProto } from 'juno-proto';
import { lastValueFrom } from 'rxjs';

const { API_KEY_SERVICE_NAME } = ApiKeyProto;

@Injectable()
export class ApiKeyMiddleware implements NestMiddleware, OnModuleInit {
  private apiKeyService: ApiKeyProto.ApiKeyServiceClient;

  constructor(@Inject(API_KEY_SERVICE_NAME) private apiKeyClient: ClientGrpc) {}

  onModuleInit() {
    this.apiKeyService =
      this.apiKeyClient.getService<ApiKeyProto.ApiKeyServiceClient>(
        ApiKeyProto.API_KEY_SERVICE_NAME,
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
      throw new UnauthorizedException('API Key not found');
    }

    try {
      const apiKeyValidation = this.apiKeyService.validateApiKey({
        apiKey: token,
      });
      const res = await lastValueFrom(apiKeyValidation);
      req.apiKey = res.key;
      next();
    } catch (error) {
      throw new UnauthorizedException('Invalid API Key');
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
