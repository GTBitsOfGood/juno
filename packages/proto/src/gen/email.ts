/* eslint-disable */
import { GrpcMethod, GrpcStreamMethod } from '@nestjs/microservices';
import { Observable } from 'rxjs';
import { EmailIdentifier, ProjectIdentifier } from './identifiers';

export const protobufPackage = 'juno.email';

export interface Email {
  name: string;
  description?: string | undefined;
  project: ProjectIdentifier | undefined;
}

export interface SendEmailRequest {
  recipients: EmailRecipient[];
  sender: EmailSender | undefined;
  content: EmailContent[];
}

export interface SendEmailResponse {
  statusCode: number;
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

export interface CreateEmailRequest {
  name: string;
  project: ProjectIdentifier | undefined;
  description?: string | undefined;
}

export interface EmailUpdateParams {
  description?: string | undefined;
}

export interface UpdateEmailRequest {
  emailIdentifier: EmailIdentifier | undefined;
  updateParams: EmailUpdateParams | undefined;
}

export const JUNO_EMAIL_PACKAGE_NAME = 'juno.email';

export interface EmailServiceClient {
  sendEmail(request: SendEmailRequest): Observable<SendEmailResponse>;
}

export interface EmailServiceController {
  sendEmail(
    request: SendEmailRequest,
  ):
    | Promise<SendEmailResponse>
    | Observable<SendEmailResponse>
    | SendEmailResponse;
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

export interface EmailDbServiceClient {
  getEmail(request: EmailIdentifier): Observable<Email>;

  createEmail(request: CreateEmailRequest): Observable<Email>;

  updateEmail(request: UpdateEmailRequest): Observable<Email>;

  deleteEmail(request: EmailIdentifier): Observable<Email>;
}

export interface EmailDbServiceController {
  getEmail(
    request: EmailIdentifier,
  ): Promise<Email> | Observable<Email> | Email;

  createEmail(
    request: CreateEmailRequest,
  ): Promise<Email> | Observable<Email> | Email;

  updateEmail(
    request: UpdateEmailRequest,
  ): Promise<Email> | Observable<Email> | Email;

  deleteEmail(
    request: EmailIdentifier,
  ): Promise<Email> | Observable<Email> | Email;
}

export function EmailDbServiceControllerMethods() {
  return function (constructor: Function) {
    const grpcMethods: string[] = [
      'getEmail',
      'createEmail',
      'updateEmail',
      'deleteEmail',
    ];
    for (const method of grpcMethods) {
      const descriptor: any = Reflect.getOwnPropertyDescriptor(
        constructor.prototype,
        method,
      );
      GrpcMethod('EmailDbService', method)(
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
      GrpcStreamMethod('EmailDbService', method)(
        constructor.prototype[method],
        method,
        descriptor,
      );
    }
  };
}

export const EMAIL_DB_SERVICE_NAME = 'EmailDbService';
