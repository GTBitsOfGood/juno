/* eslint-disable */
import { GrpcMethod, GrpcStreamMethod } from '@nestjs/microservices';
import { Observable } from 'rxjs';

export const protobufPackage = 'authservice.api_key';

export interface IssueApiKeyRequest {}

export interface IssueApiKeyResponse {}

export interface RevokeApiKeyRequest {}

export interface RevokeApiKeyResponse {}

export interface GetProjectByApiKeyRequest {
  apiKey: string;
}

export interface GetProjectByApiKeyResponse {
  success: boolean;
  projectId?: string | undefined;
  scopes: string[];
  error?: string | undefined;
}

export interface GetHashedApiKeyRequest {
  apiKey: string;
}

export interface GetHashedApiKeyResponse {
  success: boolean;
  hashedApiKey?: string | undefined;
  error?: string | undefined;
}

export interface ValidateHashedApiKeyRequest {
  hashedApiKey: string;
}

export interface ValidateHashedApiKeyResponse {
  success: boolean;
  validHash: boolean;
  error?: string | undefined;
}

export const AUTHSERVICE_API_KEY_PACKAGE_NAME = 'authservice.api_key';

export interface ApiKeyServiceClient {
  issueApiKey(request: IssueApiKeyRequest): Observable<IssueApiKeyResponse>;

  revokeApiKey(request: RevokeApiKeyRequest): Observable<RevokeApiKeyResponse>;

  getProjectByApiKey(
    request: GetProjectByApiKeyRequest,
  ): Observable<GetProjectByApiKeyResponse>;

  getHashedApiKey(
    request: GetHashedApiKeyRequest,
  ): Observable<GetHashedApiKeyResponse>;

  validateHashedApiKey(
    request: ValidateHashedApiKeyRequest,
  ): Observable<ValidateHashedApiKeyResponse>;
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

  getProjectByApiKey(
    request: GetProjectByApiKeyRequest,
  ):
    | Promise<GetProjectByApiKeyResponse>
    | Observable<GetProjectByApiKeyResponse>
    | GetProjectByApiKeyResponse;

  getHashedApiKey(
    request: GetHashedApiKeyRequest,
  ):
    | Promise<GetHashedApiKeyResponse>
    | Observable<GetHashedApiKeyResponse>
    | GetHashedApiKeyResponse;

  validateHashedApiKey(
    request: ValidateHashedApiKeyRequest,
  ):
    | Promise<ValidateHashedApiKeyResponse>
    | Observable<ValidateHashedApiKeyResponse>
    | ValidateHashedApiKeyResponse;
}

export function ApiKeyServiceControllerMethods() {
  return function (constructor: Function) {
    const grpcMethods: string[] = [
      'issueApiKey',
      'revokeApiKey',
      'getProjectByApiKey',
      'getHashedApiKey',
      'validateHashedApiKey',
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
