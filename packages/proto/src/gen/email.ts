/* eslint-disable */
import { GrpcMethod, GrpcStreamMethod } from '@nestjs/microservices';
import { Observable } from 'rxjs';

export const protobufPackage = 'juno.email';

export interface SendEmailRequest {
  recipients: EmailRecipient[];
  sender: EmailSender | undefined;
  content: EmailContent[];
}

export interface SendEmailResponse {
  success: boolean;
}

export interface EmailRecipient {
  email: string;
  name?: string | undefined;
}

export interface EmailSender {
  email: string;
  name?: string | undefined;
}

export interface EmailContent {
  type: string;
  value: string;
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
  sendEmail(request: SendEmailRequest): Observable<SendEmailResponse>;

  authenticateDomain(
    request: AuthenticateDomainRequest,
  ): Observable<AuthenticateDomainResponse>;
}

export interface EmailServiceController {
  sendEmail(
    request: SendEmailRequest,
  ):
    | Promise<SendEmailResponse>
    | Observable<SendEmailResponse>
    | SendEmailResponse;

  authenticateDomain(
    request: AuthenticateDomainRequest,
  ):
    | Promise<AuthenticateDomainResponse>
    | Observable<AuthenticateDomainResponse>
    | AuthenticateDomainResponse;
}

export function EmailServiceControllerMethods() {
  return function (constructor: Function) {
    const grpcMethods: string[] = ['sendEmail', 'authenticateDomain'];
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
