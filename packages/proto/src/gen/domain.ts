/* eslint-disable */
import { GrpcMethod, GrpcStreamMethod } from '@nestjs/microservices';
import { Observable } from 'rxjs';

export const protobufPackage = 'juno.domain';

export interface VerifyDomainRequest {
  domain: string;
}

export interface VerifyDomainResponse {}

export interface RegisterDomainRequest {
  domain: string;
  subDomain: string;
}

export interface RegisterDomainResponse {}

export const JUNO_DOMAIN_PACKAGE_NAME = 'juno.domain';

export interface DomainServiceClient {
  verifyDomain(request: VerifyDomainRequest): Observable<VerifyDomainResponse>;

  registerDomain(
    request: RegisterDomainRequest,
  ): Observable<RegisterDomainResponse>;
}

export interface DomainServiceController {
  verifyDomain(
    request: VerifyDomainRequest,
  ):
    | Promise<VerifyDomainResponse>
    | Observable<VerifyDomainResponse>
    | VerifyDomainResponse;

  registerDomain(
    request: RegisterDomainRequest,
  ):
    | Promise<RegisterDomainResponse>
    | Observable<RegisterDomainResponse>
    | RegisterDomainResponse;
}

export function DomainServiceControllerMethods() {
  return function (constructor: Function) {
    const grpcMethods: string[] = ['verifyDomain', 'registerDomain'];
    for (const method of grpcMethods) {
      const descriptor: any = Reflect.getOwnPropertyDescriptor(
        constructor.prototype,
        method,
      );
      GrpcMethod('DomainService', method)(
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
      GrpcStreamMethod('DomainService', method)(
        constructor.prototype[method],
        method,
        descriptor,
      );
    }
  };
}

export const DOMAIN_SERVICE_NAME = 'DomainService';
