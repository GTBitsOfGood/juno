import { Body, Controller } from '@nestjs/common';
import { EmailService } from './email.service';
import { EmailProto } from 'juno-proto';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';

@Controller()
@EmailProto.EmailServiceControllerMethods()
export class EmailController implements EmailProto.EmailServiceController {
  constructor(private readonly emailService: EmailService) {}

  async authenticateDomain(
    @Body() req: EmailProto.AuthenticateDomainRequest,
  ): Promise<EmailProto.AuthenticateDomainResponse> {
    return await this.emailService.authenticateDomain(req);
  }

  async sendEmail(
    request: EmailProto.SendEmailRequest,
  ): Promise<EmailProto.SendEmailResponse> {
    if (
      !request.recipients ||
      request.recipients.length == 0 ||
      !request.recipients.every(
        (value) => value.email && value.email.length != 0,
      )
    ) {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: 'Invalid recipient list',
      });
    }
    if (
      !request.content ||
      request.content.length == 0 ||
      !request.content.every(
        (value) =>
          value.value &&
          value.value.length != 0 &&
          value.type &&
          value.type.length != 0,
      )
    ) {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: 'Invalid content list',
      });
    }
    if (
      !request.sender ||
      !request.sender.email ||
      request.sender.email.length == 0
    ) {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: 'Invalid sender',
      });
    }
    try {
      await this.emailService.sendEmail(request);
      return { statusCode: 200 };
    } catch (error) {
      throw new RpcException(error.message);
    }
  }

  async registerSender(
    req: EmailProto.RegisterSenderRequest,
  ): Promise<EmailProto.RegisterSenderResponse> {
    return await this.emailService.registerSender(req);
  }

  async verifyDomain(
    request: EmailProto.VerifyDomainRequest,
  ): Promise<EmailProto.VerifyDomainResponse> {
    return this.emailService.verifyDomain(request);
  }
}
