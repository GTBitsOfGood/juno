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

export interface AuthenticateDomainRequest {
  domain: string;
  subdomain: string;
}

export interface AuthenticateDomainResponse {
  id: number;
  valid: string;
  records: SendGridDnsRecords | undefined;
  statusCode: number;
}

export interface SendGridDnsRecords {
  mailCname: SendGridRecord | undefined;
  dkim1: SendGridRecord | undefined;
  dkim2: SendGridRecord | undefined;
}

export interface SendGridRecord {
  valid: boolean;
  type: string;
  host: string;
  data: string;
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

export interface SendGridEmailServiceClient {
  authenticateDomain(
    request: AuthenticateDomainRequest,
  ): Observable<AuthenticateDomainResponse>;
}

export interface SendGridEmailServiceController {
  authenticateDomain(
    request: AuthenticateDomainRequest,
  ):
    | Promise<AuthenticateDomainResponse>
    | Observable<AuthenticateDomainResponse>
    | AuthenticateDomainResponse;
}

export function SendGridEmailServiceControllerMethods() {
  return function (constructor: Function) {
    const grpcMethods: string[] = ['authenticateDomain'];
    for (const method of grpcMethods) {
      const descriptor: any = Reflect.getOwnPropertyDescriptor(
        constructor.prototype,
        method,
      );
      GrpcMethod('SendGridEmailService', method)(
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
      GrpcStreamMethod('SendGridEmailService', method)(
        constructor.prototype[method],
        method,
        descriptor,
      );
    }
  };
}

export const SEND_GRID_EMAIL_SERVICE_NAME = 'SendGridEmailService';
