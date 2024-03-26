/* eslint-disable */
import { GrpcMethod, GrpcStreamMethod } from '@nestjs/microservices';
import { Observable } from 'rxjs';

export const protobufPackage = 'juno.logging';

export interface RecordInfoRequest {
  message: string;
}

export interface RecordInfoResponse {}

export const JUNO_LOGGING_PACKAGE_NAME = 'juno.logging';

export interface LoggingServiceClient {
  recordInfo(request: RecordInfoRequest): Observable<RecordInfoResponse>;
}

export interface LoggingServiceController {
  recordInfo(
    request: RecordInfoRequest,
  ):
    | Promise<RecordInfoResponse>
    | Observable<RecordInfoResponse>
    | RecordInfoResponse;
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
