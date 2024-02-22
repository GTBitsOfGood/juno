import {
  Inject,
  Injectable,
  NestMiddleware,
  OnModuleInit,
} from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { firstValueFrom } from 'rxjs';
import { UserType } from 'juno-proto/dist/gen/user';
import { ClientGrpc } from '@nestjs/microservices';
import { UserProto } from 'juno-proto';

const { USER_AUTH_SERVICE_NAME } = UserProto;

@Injectable()
export class CredentialsMiddleware implements NestMiddleware, OnModuleInit {
  private userAuthService: UserProto.UserAuthServiceClient;

  constructor(@Inject(USER_AUTH_SERVICE_NAME) private authClient: ClientGrpc) {}

  onModuleInit() {
    this.userAuthService =
      this.authClient.getService<UserProto.UserAuthServiceClient>(
        USER_AUTH_SERVICE_NAME,
      );
  }

  async use(req: Request, res: Response, next: NextFunction) {
    const emailHeader = req.header('X-User-Email');
    const passwordHeader = req.header('X-User-Password');

    // If invalid headers, return 401
    if (!emailHeader || !passwordHeader) {
      return res.status(401);
    }

    // Wait for RPC result from authentication request
    const user = await firstValueFrom(
      this.userAuthService.authenticate({
        email: emailHeader,
        password: passwordHeader,
      }),
    );

    // If the user doesn't have valid permissions, return 401
    if (!user || user.type !== UserType.SUPERADMIN) {
      return res.status(401);
    }

    next();
  }
}
