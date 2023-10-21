/* eslint-disable */
import { GrpcMethod, GrpcStreamMethod } from "@nestjs/microservices";
import { Observable } from "rxjs";

export const protobufPackage = "authservice.api_key";

export interface IssueApiKeyRequest {
}

export interface IssueApiKeyResponse {
}

export interface RevokeApiKeyRequest {
}

export interface RevokeApiKeyResponse {
}

export const AUTHSERVICE_API_KEY_PACKAGE_NAME = "authservice.api_key";

export interface ApiKeyServiceClient {
  issueApiKey(request: IssueApiKeyRequest): Observable<IssueApiKeyResponse>;

  revokeApiKey(request: RevokeApiKeyRequest): Observable<RevokeApiKeyResponse>;
}

export interface ApiKeyServiceController {
  issueApiKey(
    request: IssueApiKeyRequest,
  ): Promise<IssueApiKeyResponse> | Observable<IssueApiKeyResponse> | IssueApiKeyResponse;

  revokeApiKey(
    request: RevokeApiKeyRequest,
  ): Promise<RevokeApiKeyResponse> | Observable<RevokeApiKeyResponse> | RevokeApiKeyResponse;
}

export function ApiKeyServiceControllerMethods() {
  return function (constructor: Function) {
    const grpcMethods: string[] = ["issueApiKey", "revokeApiKey"];
    for (const method of grpcMethods) {
      const descriptor: any = Reflect.getOwnPropertyDescriptor(constructor.prototype, method);
      GrpcMethod("ApiKeyService", method)(constructor.prototype[method], method, descriptor);
    }
    const grpcStreamMethods: string[] = [];
    for (const method of grpcStreamMethods) {
      const descriptor: any = Reflect.getOwnPropertyDescriptor(constructor.prototype, method);
      GrpcStreamMethod("ApiKeyService", method)(constructor.prototype[method], method, descriptor);
    }
  };
}

export const API_KEY_SERVICE_NAME = "ApiKeyService";
