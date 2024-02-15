import {
  Body,
  Controller,
  Post,
  Req,
  Inject,
  OnModuleInit,
  Request,
  UnauthorizedException,
} from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { EmailProto } from 'juno-proto';
import { JwtServiceController } from '';
import { lastValueFrom } from 'rxjs';
import { RegisterEmailModel, RegisterEmailResponse } from 'src/models/email';

const { EMAIL_SERVICE_NAME } = EmailProto;

@Controller('email')
export class EmailController implements OnModuleInit {
  private emailService: EmailProto.EmailServiceClient;
  private jwtController: JwtServiceController;

  constructor(@Inject(EMAIL_SERVICE_NAME) private emailClient: ClientGrpc) {}

  onModuleInit() {
    this.emailService =
      this.emailClient.getService<EmailProto.EmailServiceClient>(
        EMAIL_SERVICE_NAME,
      );
  }

  @Post('register')
  async registerSenderAddress(
    @Body('') params: RegisterEmailModel,
    @Req() request: Request,
  ) {
    const authHeader = request.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      throw new UnauthorizedException('No JWT token provided');
    }

    const validationResponse = await this.jwtController.validateJwt({ token });

    if (!validationResponse.isValid) {
      throw new UnauthorizedException('Invalid JWT token');
    }

    const registeredEmail = this.emailService.registerSenderAddress(params);

    return new RegisterEmailResponse(await lastValueFrom(registeredEmail));
  }
}
