import {
  Injectable,
  NestMiddleware,
  Inject,
  OnModuleInit,
  HttpException,
  HttpStatus,
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
    try {
      if (
        req.headers.authorization === undefined ||
        req.headers.authorization.length === 0
      ) {
        throw new Error('No authorization headers');
      }
      const token = this.extractTokenFromHeader(req);
      if (!token) {
        throw new Error('API Key not found');
      }

      const apiKeyValidation = this.apiKeyService.validateApiKey({
        apiKey: token,
      });
      const res = await lastValueFrom(apiKeyValidation);

      if (!res.valid) {
        throw new Error('Invalid API Key');
      }

      req.apiKey = res.key;

      next();
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.UNAUTHORIZED);
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
