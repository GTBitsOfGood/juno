/* eslint-disable */
import { GrpcMethod, GrpcStreamMethod } from '@nestjs/microservices';
import { Observable } from 'rxjs';

export const protobufPackage = 'logging';

/** The request message containing the error message. */
export interface ErrorLogRequest {
  message: string;
}

/** TODO: to be defined later */
export interface ErrorLogResponse {}

export const LOGGING_PACKAGE_NAME = 'logging';

export interface LoggingServiceClient {
  recordError(request: ErrorLogRequest): Observable<ErrorLogResponse>;
}

export interface LoggingServiceController {
  recordError(
    request: ErrorLogRequest,
  ):
    | Promise<ErrorLogResponse>
    | Observable<ErrorLogResponse>
    | ErrorLogResponse;
}

export function LoggingServiceControllerMethods() {
  return function (constructor: Function) {
    const grpcMethods: string[] = ['recordError'];
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
