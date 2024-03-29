/* eslint-disable */
import { GrpcMethod, GrpcStreamMethod } from '@nestjs/microservices';
import { Observable } from 'rxjs';

export const protobufPackage = 'juno.reset_db';

export interface ResetDbRequest {}

export interface ResetDbResponse {}

export const JUNO_RESET_DB_PACKAGE_NAME = 'juno.reset_db';

export interface DatabaseResetClient {
  resetDb(request: ResetDbRequest): Observable<ResetDbResponse>;
}

export interface DatabaseResetController {
  resetDb(
    request: ResetDbRequest,
  ): Promise<ResetDbResponse> | Observable<ResetDbResponse> | ResetDbResponse;
}

export function DatabaseResetControllerMethods() {
  return function (constructor: Function) {
    const grpcMethods: string[] = ['resetDb'];
    for (const method of grpcMethods) {
      const descriptor: any = Reflect.getOwnPropertyDescriptor(
        constructor.prototype,
        method,
      );
      GrpcMethod('DatabaseReset', method)(
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
      GrpcStreamMethod('DatabaseReset', method)(
        constructor.prototype[method],
        method,
        descriptor,
      );
    }
  };
}

export const DATABASE_RESET_SERVICE_NAME = 'DatabaseReset';
