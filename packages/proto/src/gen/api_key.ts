/* eslint-disable */
import { GrpcMethod, GrpcStreamMethod } from '@nestjs/microservices';
import { Observable } from 'rxjs';
import { ProjectIdentifier } from './identifiers';

export const protobufPackage = 'juno.api_key';

export enum ApiScopes {
  FULL = 0,
  UNRECOGNIZED = -1,
}

export interface IssueApiKeyRequest {
  projectName: string;
  email: string;
  password: string;
  environment: string;
  description: string;
  userVisible: boolean;
}

export interface CreateApiKeyParams {
  apiKey: ApiKey | undefined;
}

export interface ApiKey {
  hash: string;
  uuid: string;
  environment: string;
  description: string;
  userVisible: boolean;
  scopes: ApiScopes[];
  project: ProjectIdentifier | undefined;
}

export interface IssueApiKeyResponse {
  apiKey?: string | undefined;
}

export interface RevokeApiKeyRequest {}

export interface RevokeApiKeyResponse {}

export const JUNO_API_KEY_PACKAGE_NAME = 'juno.api_key';

export interface ApiKeyServiceClient {
  issueApiKey(request: IssueApiKeyRequest): Observable<IssueApiKeyResponse>;

  createApiKey(request: CreateApiKeyParams): Observable<ApiKey>;

  revokeApiKey(request: RevokeApiKeyRequest): Observable<RevokeApiKeyResponse>;
}

export interface ApiKeyServiceController {
  issueApiKey(
    request: IssueApiKeyRequest,
  ):
    | Promise<IssueApiKeyResponse>
    | Observable<IssueApiKeyResponse>
    | IssueApiKeyResponse;

  createApiKey(
    request: CreateApiKeyParams,
  ): Promise<ApiKey> | Observable<ApiKey> | ApiKey;

  revokeApiKey(
    request: RevokeApiKeyRequest,
  ):
    | Promise<RevokeApiKeyResponse>
    | Observable<RevokeApiKeyResponse>
    | RevokeApiKeyResponse;
}

export function ApiKeyServiceControllerMethods() {
  return function (constructor: Function) {
    const grpcMethods: string[] = [
      'issueApiKey',
      'createApiKey',
      'revokeApiKey',
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
