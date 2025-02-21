// Code generated by protoc-gen-ts_proto. DO NOT EDIT.
// versions:
//   protoc-gen-ts_proto  v1.181.2
//   protoc               v5.28.3
// source: api_key.proto

/* eslint-disable */
import { GrpcMethod, GrpcStreamMethod } from '@nestjs/microservices';
import { Observable } from 'rxjs';
import { ApiKey, ApiScope } from './auth_common';
import { ApiKeyIdentifier, ProjectIdentifier } from './identifiers';

export const protobufPackage = 'juno.api_key';

export interface IssueApiKeyRequest {
  project: ProjectIdentifier | undefined;
  description: string;
  environment: string;
}

export interface ValidateApiKeyRequest {
  apiKey: string;
}

export interface ValidateApiKeyResponse {
  valid: boolean;
  key: ApiKey | undefined;
}

export interface CreateApiKeyParams {
  apiKey: ApiKeyNoId | undefined;
}

export interface ApiKeyNoId {
  hash: string;
  description: string;
  scopes: ApiScope[];
  project: ProjectIdentifier | undefined;
  environment: string;
}

export interface IssueApiKeyResponse {
  apiKey: string;
  info: ApiKeyNoId | undefined;
}

export interface RevokeApiKeyRequest {
  apiKey: string;
}

export interface RevokeApiKeyResponse {
  success: boolean;
}

export const JUNO_API_KEY_PACKAGE_NAME = 'juno.api_key';

export interface ApiKeyServiceClient {
  issueApiKey(request: IssueApiKeyRequest): Observable<IssueApiKeyResponse>;

  revokeApiKey(request: RevokeApiKeyRequest): Observable<RevokeApiKeyResponse>;

  validateApiKey(
    request: ValidateApiKeyRequest,
  ): Observable<ValidateApiKeyResponse>;
}

export interface ApiKeyServiceController {
  issueApiKey(
    request: IssueApiKeyRequest,
  ):
    | Promise<IssueApiKeyResponse>
    | Observable<IssueApiKeyResponse>
    | IssueApiKeyResponse;

  revokeApiKey(
    request: RevokeApiKeyRequest,
  ):
    | Promise<RevokeApiKeyResponse>
    | Observable<RevokeApiKeyResponse>
    | RevokeApiKeyResponse;

  validateApiKey(
    request: ValidateApiKeyRequest,
  ):
    | Promise<ValidateApiKeyResponse>
    | Observable<ValidateApiKeyResponse>
    | ValidateApiKeyResponse;
}

export function ApiKeyServiceControllerMethods() {
  return function (constructor: Function) {
    const grpcMethods: string[] = [
      'issueApiKey',
      'revokeApiKey',
      'validateApiKey',
    ];
    for (const method of grpcMethods) {
      const descriptor: any = Reflect.getOwnPropertyDescriptor(
        constructor.prototype,
        method,
      );
      GrpcMethod('ApiKeyService', method)(
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
      GrpcStreamMethod('ApiKeyService', method)(
        constructor.prototype[method],
        method,
        descriptor,
      );
    }
  };
}

export const API_KEY_SERVICE_NAME = 'ApiKeyService';

export interface ApiKeyDbServiceClient {
  createApiKey(request: CreateApiKeyParams): Observable<ApiKey>;

  getApiKey(request: ApiKeyIdentifier): Observable<ApiKey>;

  deleteApiKey(request: ApiKeyIdentifier): Observable<ApiKey>;
}

export interface ApiKeyDbServiceController {
  createApiKey(
    request: CreateApiKeyParams,
  ): Promise<ApiKey> | Observable<ApiKey> | ApiKey;

  getApiKey(
    request: ApiKeyIdentifier,
  ): Promise<ApiKey> | Observable<ApiKey> | ApiKey;

  deleteApiKey(
    request: ApiKeyIdentifier,
  ): Promise<ApiKey> | Observable<ApiKey> | ApiKey;
}

export function ApiKeyDbServiceControllerMethods() {
  return function (constructor: Function) {
    const grpcMethods: string[] = ['createApiKey', 'getApiKey', 'deleteApiKey'];
    for (const method of grpcMethods) {
      const descriptor: any = Reflect.getOwnPropertyDescriptor(
        constructor.prototype,
        method,
      );
      GrpcMethod('ApiKeyDbService', method)(
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
      GrpcStreamMethod('ApiKeyDbService', method)(
        constructor.prototype[method],
        method,
        descriptor,
      );
    }
  };
}

export const API_KEY_DB_SERVICE_NAME = 'ApiKeyDbService';
