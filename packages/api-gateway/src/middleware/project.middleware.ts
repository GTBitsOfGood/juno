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
export class ProjectLinkingMiddleware implements NestMiddleware, OnModuleInit {
  private jwtService: JwtProto.JwtServiceClient;

  constructor(@Inject(JWT_SERVICE_NAME) private jwtClient: ClientGrpc) {}

  onModuleInit() {
    this.jwtService = this.jwtClient.getService<JwtProto.JwtServiceClient>(
      JwtProto.JWT_SERVICE_NAME,
    );
  }

  async use(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.headers.authorization) {
        throw new Error('No authorization headers');
      }
      const token = this.extractTokenFromHeader(req);
      if (!token) {
        throw new Error('Jwt not found');
      }
      const jwtValidation = this.jwtService.validateApiKeyJwt({ jwt: token });
      const jwt = await lastValueFrom(jwtValidation);
      if (!jwt.valid) {
        throw new Error('Invalid jwt');
      }
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
