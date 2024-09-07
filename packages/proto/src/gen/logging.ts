// Code generated by protoc-gen-ts_proto. DO NOT EDIT.
// versions:
//   protoc-gen-ts_proto  v1.181.2
//   protoc               v5.26.0
// source: logging.proto

/* eslint-disable */
import { GrpcMethod, GrpcStreamMethod } from "@nestjs/microservices";
import { Observable } from "rxjs";

export const protobufPackage = "juno.logging";

export interface RecordInfoRequest {
  msg: string;
}

export interface RecordInfoResponse {
}

export interface ErrorLogRequest {
  msg: string;
}

/** TODO: to be defined later */
export interface ErrorLogResponse {
}

export const JUNO_LOGGING_PACKAGE_NAME = "juno.logging";

export interface LoggingServiceClient {
  recordInfo(request: RecordInfoRequest): Observable<RecordInfoResponse>;

  recordError(request: ErrorLogRequest): Observable<ErrorLogResponse>;
}

export interface LoggingServiceController {
  recordInfo(
    request: RecordInfoRequest,
  ): Promise<RecordInfoResponse> | Observable<RecordInfoResponse> | RecordInfoResponse;

  recordError(request: ErrorLogRequest): Promise<ErrorLogResponse> | Observable<ErrorLogResponse> | ErrorLogResponse;
}

export function LoggingServiceControllerMethods() {
  return function (constructor: Function) {
    const grpcMethods: string[] = ["recordInfo", "recordError"];
    for (const method of grpcMethods) {
      const descriptor: any = Reflect.getOwnPropertyDescriptor(constructor.prototype, method);
      GrpcMethod("LoggingService", method)(constructor.prototype[method], method, descriptor);
    }
    const grpcStreamMethods: string[] = [];
    for (const method of grpcStreamMethods) {
      const descriptor: any = Reflect.getOwnPropertyDescriptor(constructor.prototype, method);
      GrpcStreamMethod("LoggingService", method)(constructor.prototype[method], method, descriptor);
    }
  };
}

export const LOGGING_SERVICE_NAME = "LoggingService";
