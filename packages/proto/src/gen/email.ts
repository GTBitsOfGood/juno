/* eslint-disable */
import { GrpcMethod, GrpcStreamMethod } from '@nestjs/microservices';
import { Observable } from 'rxjs';

export const protobufPackage = 'juno.email';

export interface SendEmailRequest {
  destination: string;
  subject: string;
  body: string;
}

export interface SendEmailRequestResponse {
  success: boolean;
}

export interface RegisterSenderRequest {
  fromEmail: string;
  fromName: string;
  replyTo: string;
}

export interface RegisterSenderResponse {
  statusCode: number;
  message: string;
}

export const JUNO_EMAIL_PACKAGE_NAME = 'juno.email';

export interface EmailServiceClient {
  sendEmail(request: SendEmailRequest): Observable<SendEmailRequestResponse>;

  registerSender(
    request: RegisterSenderRequest,
  ): Observable<RegisterSenderResponse>;
}

export interface EmailServiceController {
  sendEmail(
    request: SendEmailRequest,
  ):
    | Promise<SendEmailRequestResponse>
    | Observable<SendEmailRequestResponse>
    | SendEmailRequestResponse;

  registerSender(
    request: RegisterSenderRequest,
  ):
    | Promise<RegisterSenderResponse>
    | Observable<RegisterSenderResponse>
    | RegisterSenderResponse;
}

export function EmailServiceControllerMethods() {
  return function (constructor: Function) {
    const grpcMethods: string[] = ['sendEmail', 'registerSender'];
    for (const method of grpcMethods) {
      const descriptor: any = Reflect.getOwnPropertyDescriptor(
        constructor.prototype,
        method,
      );
      GrpcMethod('EmailService', method)(
        constructor.prototype[method],
        method,
        descriptor,
      );
    }
    const grpcStreamMethods: string[] = [];
    for (const method of grpcStreamMethods) {
      const descriptor: any = Reflect.getOwnPropertyDescriptor(
        constructor.prototype,
        method,
      );
      GrpcStreamMethod('EmailService', method)(
        constructor.prototype[method],
        method,
        descriptor,
      );
    }
  };
}

export const EMAIL_SERVICE_NAME = 'EmailService';
