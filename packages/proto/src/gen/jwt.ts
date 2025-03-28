// Code generated by protoc-gen-ts_proto. DO NOT EDIT.
// versions:
//   protoc-gen-ts_proto  v1.181.2
//   protoc               v5.28.2
// source: jwt.proto

/* eslint-disable */
import { GrpcMethod, GrpcStreamMethod } from '@nestjs/microservices';
import { Observable } from 'rxjs';
import { ApiKey } from './auth_common';
import { User } from './common';

export const protobufPackage = 'juno.jwt';

export interface CreateApiKeyJwtRequest {
  apiKey: string;
}

export interface ValidateJwtRequest {
  jwt: string;
}

export interface CreateUserJwtRequest {
  user: User | undefined;
}

export interface CreateJwtResponse {
  jwt: string;
}

export interface ValidateApiKeyJwtResponse {
  valid: boolean;
  apiKey?: ApiKey | undefined;
}

export interface ValidateUserJwtResponse {
  valid: boolean;
  user?: User | undefined;
}

export const JUNO_JWT_PACKAGE_NAME = 'juno.jwt';

export interface JwtServiceClient {
  createApiKeyJwt(
    request: CreateApiKeyJwtRequest,
  ): Observable<CreateJwtResponse>;

  validateApiKeyJwt(
    request: ValidateJwtRequest,
  ): Observable<ValidateApiKeyJwtResponse>;

  createUserJwt(request: CreateUserJwtRequest): Observable<CreateJwtResponse>;

  validateUserJwt(
    request: ValidateJwtRequest,
  ): Observable<ValidateUserJwtResponse>;
}

export interface JwtServiceController {
  createApiKeyJwt(
    request: CreateApiKeyJwtRequest,
  ):
    | Promise<CreateJwtResponse>
    | Observable<CreateJwtResponse>
    | CreateJwtResponse;

  validateApiKeyJwt(
    request: ValidateJwtRequest,
  ):
    | Promise<ValidateApiKeyJwtResponse>
    | Observable<ValidateApiKeyJwtResponse>
    | ValidateApiKeyJwtResponse;

  createUserJwt(
    request: CreateUserJwtRequest,
  ):
    | Promise<CreateJwtResponse>
    | Observable<CreateJwtResponse>
    | CreateJwtResponse;

  validateUserJwt(
    request: ValidateJwtRequest,
  ):
    | Promise<ValidateUserJwtResponse>
    | Observable<ValidateUserJwtResponse>
    | ValidateUserJwtResponse;
}

export function JwtServiceControllerMethods() {
  return function (constructor: Function) {
    const grpcMethods: string[] = [
      'createApiKeyJwt',
      'validateApiKeyJwt',
      'createUserJwt',
      'validateUserJwt',
    ];
    for (const method of grpcMethods) {
      const descriptor: any = Reflect.getOwnPropertyDescriptor(
        constructor.prototype,
        method,
      );
      GrpcMethod('JwtService', method)(
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
      GrpcStreamMethod('JwtService', method)(
        constructor.prototype[method],
        method,
        descriptor,
      );
    }
  };
}

export const JWT_SERVICE_NAME = 'JwtService';
