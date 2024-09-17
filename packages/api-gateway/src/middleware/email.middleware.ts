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
import { JwtProto } from 'juno-proto';
import { lastValueFrom } from 'rxjs';

const { JWT_SERVICE_NAME } = JwtProto;

@Injectable()
export class EmailLinkingMiddleware implements NestMiddleware, OnModuleInit {
  private jwtService: JwtProto.JwtServiceClient;

  constructor(@Inject(JWT_SERVICE_NAME) private jwtClient: ClientGrpc) { }

  onModuleInit() {
    this.jwtService = this.jwtClient.getService<JwtProto.JwtServiceClient>(
      JwtProto.JWT_SERVICE_NAME,
    );
  }

  async use(req: Request, res: Response, next: NextFunction) {
    try {
      if (
        req.headers.authorization === undefined ||
        req.headers.authorization.length === 0
      ) {
        throw new Error('No authorization headers');
      }
      const token = this.extractTokenFromHeader(req);
      if (!token) {
        throw new Error('Jwt not found');
      }

      const jwtValidation = this.jwtService.validateJwt({ jwt: token });
      const res = await lastValueFrom(jwtValidation);

      if (!res.valid) {
        throw new Error('Invalid JWT');
      }

      next();
    } catch {
      throw new HttpException(
        'Invalid user credentials',
        HttpStatus.UNAUTHORIZED,
      );
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
