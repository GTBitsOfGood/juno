/* eslint-disable */
import { GrpcMethod, GrpcStreamMethod } from '@nestjs/microservices';
import { Observable } from 'rxjs';
import { ProjectIdentifier } from './identifiers';

export const protobufPackage = 'juno.api_key';

export enum ApiScope {
  FULL = 0,
  UNRECOGNIZED = -1,
}

export interface IssueApiKeyRequest {
  project: ProjectIdentifier | undefined;
  email: string;
  password: string;
  description: string;
}

export interface CreateApiKeyParams {
  apiKey: ApiKeyNoId | undefined;
}

export interface ApiKey {
  id: string;
  hash: string;
  description: string;
  scopes: ApiScope[];
  project: ProjectIdentifier | undefined;
  environment: string;
}

export interface ApiKeyNoId {
  hash: string;
  description: string;
  scopes: ApiScope[];
  project: ProjectIdentifier | undefined;
  environment: string;
}

export interface IssueApiKeyResponse {
  apiKey?: ApiKey | undefined;
}

export interface RevokeApiKeyRequest {}

export interface RevokeApiKeyResponse {}

export const JUNO_API_KEY_PACKAGE_NAME = 'juno.api_key';

export interface ApiKeyServiceClient {
  issueApiKey(request: IssueApiKeyRequest): Observable<IssueApiKeyResponse>;

  revokeApiKey(request: RevokeApiKeyRequest): Observable<RevokeApiKeyResponse>;
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
}

export function ApiKeyServiceControllerMethods() {
  return function (constructor: Function) {
    const grpcMethods: string[] = ['issueApiKey', 'revokeApiKey'];
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
}

export interface ApiKeyDbServiceController {
  createApiKey(
    request: CreateApiKeyParams,
  ): Promise<ApiKey> | Observable<ApiKey> | ApiKey;
}

export function ApiKeyDbServiceControllerMethods() {
  return function (constructor: Function) {
    const grpcMethods: string[] = ['createApiKey'];
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
