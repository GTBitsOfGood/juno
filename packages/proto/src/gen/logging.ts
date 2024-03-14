/* eslint-disable */
import { GrpcMethod, GrpcStreamMethod } from '@nestjs/microservices';
import { Observable } from 'rxjs';

export const protobufPackage = 'juno.logging';

export interface recordInfoRequest {
  message: string;
}

export interface recordInfoResponse {}

export const JUNO_LOGGING_PACKAGE_NAME = 'juno.logging';

export interface LoggingServiceClient {
  recordInfo(request: recordInfoRequest): Observable<recordInfoResponse>;
}

export interface LoggingServiceController {
  recordInfo(
    request: recordInfoRequest,
  ):
    | Promise<recordInfoResponse>
    | Observable<recordInfoResponse>
    | recordInfoResponse;
}

export function LoggingServiceControllerMethods() {
  return function (constructor: Function) {
    const grpcMethods: string[] = ['recordInfo'];
    for (const method of grpcMethods) {
      const descriptor: any = Reflect.getOwnPropertyDescriptor(
        constructor.prototype,
        method,
      );
      GrpcMethod('LoggingService', method)(
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
      GrpcStreamMethod('LoggingService', method)(
        constructor.prototype[method],
        method,
        descriptor,
      );
    }
  };
}

export const LOGGING_SERVICE_NAME = 'LoggingService';
