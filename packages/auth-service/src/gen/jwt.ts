/* eslint-disable */
import { GrpcMethod, GrpcStreamMethod } from "@nestjs/microservices";
import { Observable } from "rxjs";

export const protobufPackage = "authservice.jwt";

export interface CreateJwtRequest {
}

export interface CreateJwtResponse {
}

export interface ValidateJwtRequest {
}

export interface ValidateJwtResponse {
}

export const AUTHSERVICE_JWT_PACKAGE_NAME = "authservice.jwt";

export interface JwtServiceClient {
  createJwt(request: CreateJwtRequest): Observable<CreateJwtResponse>;

  validateJwt(request: ValidateJwtRequest): Observable<ValidateJwtResponse>;
}

export interface JwtServiceController {
  createJwt(request: CreateJwtRequest): Promise<CreateJwtResponse> | Observable<CreateJwtResponse> | CreateJwtResponse;

  validateJwt(
    request: ValidateJwtRequest,
  ): Promise<ValidateJwtResponse> | Observable<ValidateJwtResponse> | ValidateJwtResponse;
}

export function JwtServiceControllerMethods() {
  return function (constructor: Function) {
    const grpcMethods: string[] = ["createJwt", "validateJwt"];
    for (const method of grpcMethods) {
      const descriptor: any = Reflect.getOwnPropertyDescriptor(constructor.prototype, method);
      GrpcMethod("JwtService", method)(constructor.prototype[method], method, descriptor);
    }
    const grpcStreamMethods: string[] = [];
    for (const method of grpcStreamMethods) {
      const descriptor: any = Reflect.getOwnPropertyDescriptor(constructor.prototype, method);
      GrpcStreamMethod("JwtService", method)(constructor.prototype[method], method, descriptor);
    }
  };
}

export const JWT_SERVICE_NAME = "JwtService";
