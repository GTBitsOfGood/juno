/* eslint-disable */
import { GrpcMethod, GrpcStreamMethod } from '@nestjs/microservices';
import { Observable } from 'rxjs';

export const protobufPackage = 'authservice.jwt';

export interface JwtForVerificationInfo {
  jwt: string;
}

export interface VerificationInfo {
  verified: boolean;
}

export interface CreateJwtProjectInfo {
  hashedApiKey: string;
  projectId: string;
  scopes: string[];
}

export interface CreateJwtInfo {
  jwt: string;
}

export interface CreateJwtRequestHeader {
  XApiKey: string;
}

export interface CreateJwtRequest {
  header: CreateJwtRequestHeader | undefined;
}

export interface CreateJwtResponse {
  success: boolean;
  error?: string | undefined;
  jwt?: string | undefined;
}

export interface ValidateJwtRequestHeader {
  authorization: string;
}

export interface ValidateJwtRequest {
  header: ValidateJwtRequestHeader | undefined;
}

export interface ValidateJwtResponse {
  success: boolean;
  verified: boolean;
  error?: string | undefined;
}

export const AUTHSERVICE_JWT_PACKAGE_NAME = 'authservice.jwt';

export interface JwtServiceClient {
  createJwt(request: CreateJwtRequest): Observable<CreateJwtResponse>;

  validateJwt(request: ValidateJwtRequest): Observable<ValidateJwtResponse>;
}

export interface JwtServiceController {
  createJwt(
    request: CreateJwtRequest,
  ):
    | Promise<CreateJwtResponse>
    | Observable<CreateJwtResponse>
    | CreateJwtResponse;

  validateJwt(
    request: ValidateJwtRequest,
  ):
    | Promise<ValidateJwtResponse>
    | Observable<ValidateJwtResponse>
    | ValidateJwtResponse;
}

export function JwtServiceControllerMethods() {
  return function (constructor: Function) {
    const grpcMethods: string[] = ['createJwt', 'validateJwt'];
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

export interface InternalJwtServiceClient {
  createJwtFromProjectInfo(
    request: CreateJwtProjectInfo,
  ): Observable<CreateJwtInfo>;

  verifyJwt(request: JwtForVerificationInfo): Observable<VerificationInfo>;
}

export interface InternalJwtServiceController {
  createJwtFromProjectInfo(
    request: CreateJwtProjectInfo,
  ): Promise<CreateJwtInfo> | Observable<CreateJwtInfo> | CreateJwtInfo;

  verifyJwt(
    request: JwtForVerificationInfo,
  ):
    | Promise<VerificationInfo>
    | Observable<VerificationInfo>
    | VerificationInfo;
}

export function InternalJwtServiceControllerMethods() {
  return function (constructor: Function) {
    const grpcMethods: string[] = ['createJwtFromProjectInfo', 'verifyJwt'];
    for (const method of grpcMethods) {
      const descriptor: any = Reflect.getOwnPropertyDescriptor(
        constructor.prototype,
        method,
      );
      GrpcMethod('InternalJwtService', method)(
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
      GrpcStreamMethod('InternalJwtService', method)(
        constructor.prototype[method],
        method,
        descriptor,
      );
    }
  };
}

export const INTERNAL_JWT_SERVICE_NAME = 'InternalJwtService';
