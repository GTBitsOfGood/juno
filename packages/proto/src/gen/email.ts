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

export const JUNO_EMAIL_PACKAGE_NAME = 'juno.email';

export interface EmailServiceClient {
  sendEmail(request: SendEmailRequest): Observable<SendEmailRequestResponse>;
}

export interface EmailServiceController {
  sendEmail(
    request: SendEmailRequest,
  ):
    | Promise<SendEmailRequestResponse>
    | Observable<SendEmailRequestResponse>
    | SendEmailRequestResponse;
}

export function EmailServiceControllerMethods() {
  return function (constructor: Function) {
    const grpcMethods: string[] = ['sendEmail'];
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
