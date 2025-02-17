import {
  Injectable,
  NestMiddleware,
  Inject,
  OnModuleInit,
  UnauthorizedException,
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
    if (!req.headers.authorization) {
      throw new UnauthorizedException('No authorization headers');
    }
    const token = this.extractTokenFromHeader(req);
    if (!token) {
      throw new UnauthorizedException('Jwt not found');
    }
    try {
      const jwtValidation = this.jwtService.validateApiKeyJwt({
        jwt: token,
      });
      await lastValueFrom(jwtValidation);
      next();
    } catch (error) {
      throw new UnauthorizedException('Invalid jwt');
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
