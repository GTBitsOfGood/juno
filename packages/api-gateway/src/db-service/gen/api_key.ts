/* eslint-disable */
import { GrpcMethod, GrpcStreamMethod } from '@nestjs/microservices';
import { Observable } from 'rxjs';
import { ProjectIdentifier } from './shared/identifiers';

export const protobufPackage = 'dbservice.api_key';

export enum ApiScopes {
  FULL = 0,
  UNRECOGNIZED = -1,
}

export interface CreateApiKeyParams {
  hash: string;
  environment: string;
  description: string;
  userVisible: boolean;
  scopes: ApiScopes[];
  project: ProjectIdentifier | undefined;
}

export interface ApiKey {
  hash: string;
  environment: string;
  description: string;
  userVisible: boolean;
  scopes: ApiScopes[];
  project: ProjectIdentifier | undefined;
}

export const DBSERVICE_API_KEY_PACKAGE_NAME = 'dbservice.api_key';

export interface ApiKeyServiceClient {
  createApiKey(request: CreateApiKeyParams): Observable<ApiKey>;
}

export interface ApiKeyServiceController {
  createApiKey(
    request: CreateApiKeyParams,
  ): Promise<ApiKey> | Observable<ApiKey> | ApiKey;
}

export function ApiKeyServiceControllerMethods() {
  return function (constructor: Function) {
    const grpcMethods: string[] = ['createApiKey'];
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
