/* eslint-disable */
import { GrpcMethod, GrpcStreamMethod } from "@nestjs/microservices";
import { Observable } from "rxjs";

export const protobufPackage = "authservice.jwt";

export interface CreateJWTRequest {
}

export interface CreateJWTResponse {
}

export interface ValidateJWTRequest {
}

export interface ValidateJWTResponse {
}

export const AUTHSERVICE_JWT_PACKAGE_NAME = "authservice.jwt";

export interface JWTServiceClient {
  createJwt(request: CreateJWTRequest): Observable<CreateJWTResponse>;

  validateJwt(request: ValidateJWTRequest): Observable<ValidateJWTResponse>;
}

export interface JWTServiceController {
  createJwt(request: CreateJWTRequest): Promise<CreateJWTResponse> | Observable<CreateJWTResponse> | CreateJWTResponse;

  validateJwt(
    request: ValidateJWTRequest,
  ): Promise<ValidateJWTResponse> | Observable<ValidateJWTResponse> | ValidateJWTResponse;
}

export function JWTServiceControllerMethods() {
  return function (constructor: Function) {
    const grpcMethods: string[] = ["createJwt", "validateJwt"];
    for (const method of grpcMethods) {
      const descriptor: any = Reflect.getOwnPropertyDescriptor(constructor.prototype, method);
      GrpcMethod("JWTService", method)(constructor.prototype[method], method, descriptor);
    }
    const grpcStreamMethods: string[] = [];
    for (const method of grpcStreamMethods) {
      const descriptor: any = Reflect.getOwnPropertyDescriptor(constructor.prototype, method);
      GrpcStreamMethod("JWTService", method)(constructor.prototype[method], method, descriptor);
    }
  };
}

export const J_WT_SERVICE_NAME = "JWTService";
