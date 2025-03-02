import {
  Inject,
  Injectable,
  NestMiddleware,
  OnModuleInit,
  HttpException,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { lastValueFrom } from 'rxjs';
import { ClientGrpc } from '@nestjs/microservices';
import { CommonProto, UserProto, JwtProto } from 'juno-proto';

const { USER_AUTH_SERVICE_NAME } = UserProto;
const { JWT_SERVICE_NAME } = JwtProto;

@Injectable()
export class CredentialsMiddleware implements NestMiddleware, OnModuleInit {
  private userAuthService: UserProto.UserAuthServiceClient;
  private jwtService: JwtProto.JwtServiceClient;

  constructor(
    @Inject(USER_AUTH_SERVICE_NAME) private authClient: ClientGrpc,
    @Inject(JWT_SERVICE_NAME) private jwtClient: ClientGrpc,
  ) {}

  onModuleInit() {
    this.userAuthService =
      this.authClient.getService<UserProto.UserAuthServiceClient>(
        USER_AUTH_SERVICE_NAME,
      );
    this.jwtService =
      this.jwtClient.getService<JwtProto.JwtServiceClient>(JWT_SERVICE_NAME);
  }

  async use(req: UserReq, res: Response, next: NextFunction) {
    const emailHeader = req.header('X-User-Email');
    const passwordHeader = req.header('X-User-Password');
    const authHeader = req.header('Authorization');

    if (emailHeader === undefined && passwordHeader === undefined) {
      // attempt to check authorization header for jwt when no email or password is provided
      if (!authHeader) {
        throw new UnauthorizedException('No email, password, or authorization headers');
      }

      const token = this.extractTokenFromHeader(req);
      if (!token) {
        throw new UnauthorizedException('JWT not found');
      }

      try {
        const jwtValidation = this.jwtService.validateUserJwt({
          jwt: token,
        });
        const validationRes = await lastValueFrom(jwtValidation);
        req.user = validationRes.user;
      } catch (error) {
        throw new UnauthorizedException('Invalid user JWT');
      }
    } else {
      // attempt to use email and password
      if (emailHeader === undefined || passwordHeader === undefined) {
        throw new HttpException(
          'Invalid credentials provided',
          HttpStatus.UNAUTHORIZED,
        );
      }
  
      try {
        // Wait for RPC result from authentication request
        const user = await lastValueFrom(
          this.userAuthService.authenticate({
            email: emailHeader,
            password: passwordHeader,
          }),
        );
  
        req.user = user;
      } catch {
        throw new HttpException(
          'Invalid user credentials',
          HttpStatus.UNAUTHORIZED,
        );
      }
    }

    next();
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}

type UserReq = Request & { user?: CommonProto.User };
