import {
  Inject,
  Injectable,
  NestMiddleware,
  OnModuleInit,
  HttpException,
  HttpStatus,
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

  constructor(@Inject(USER_AUTH_SERVICE_NAME) private authClient: ClientGrpc) { }

  onModuleInit() {
    this.userAuthService =
      this.authClient.getService<UserProto.UserAuthServiceClient>(
        USER_AUTH_SERVICE_NAME,
      );
  }

  async use(req: Request, res: Response, next: NextFunction) {
    const emailHeader = req.header('X-User-Email');
    const passwordHeader = req.header('X-User-Password');

    console.log(
      `emailHeader: ${emailHeader}, passwordHeader: ${passwordHeader}`,
    );

    // If invalid headers, return 401
    if (!emailHeader || !passwordHeader) {
      throw new HttpException(
        'User Credentials not Provided',
        HttpStatus.UNAUTHORIZED,
      );
    }

    // Wait for RPC result from authentication request
    const user = await firstValueFrom(
      this.userAuthService.authenticate({
        email: emailHeader,
        password: passwordHeader,
      }),
    );

    console.log(`user: ${JSON.stringify(user)}`);

    // If the user doesn't have valid permissions, return 401
    if (!user || user.type !== UserType.SUPERADMIN) {
      throw new HttpException(
        'Invalid User Credential',
        HttpStatus.UNAUTHORIZED,
      );
    }

    next();
  }
}
