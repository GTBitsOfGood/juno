/* eslint-disable */
import { GrpcMethod, GrpcStreamMethod } from "@nestjs/microservices";
import { Observable } from "rxjs";

export const protobufPackage = "authservice.api_key";

export interface IssueAPIKeyRequest {
}

export interface IssueAPIKeyResponse {
}

export interface RevokeAPIKeyRequest {
}

export interface RevokeAPIKeyResponse {
}

export const AUTHSERVICE_API_KEY_PACKAGE_NAME = "authservice.api_key";

export interface APIKeyServiceClient {
  issueApiKey(request: IssueAPIKeyRequest): Observable<IssueAPIKeyResponse>;

  revokeApiKey(request: RevokeAPIKeyRequest): Observable<RevokeAPIKeyResponse>;
}

export interface APIKeyServiceController {
  issueApiKey(
    request: IssueAPIKeyRequest,
  ): Promise<IssueAPIKeyResponse> | Observable<IssueAPIKeyResponse> | IssueAPIKeyResponse;

  revokeApiKey(
    request: RevokeAPIKeyRequest,
  ): Promise<RevokeAPIKeyResponse> | Observable<RevokeAPIKeyResponse> | RevokeAPIKeyResponse;
}

export function APIKeyServiceControllerMethods() {
  return function (constructor: Function) {
    const grpcMethods: string[] = ["issueApiKey", "revokeApiKey"];
    for (const method of grpcMethods) {
      const descriptor: any = Reflect.getOwnPropertyDescriptor(constructor.prototype, method);
      GrpcMethod("APIKeyService", method)(constructor.prototype[method], method, descriptor);
    }
    const grpcStreamMethods: string[] = [];
    for (const method of grpcStreamMethods) {
      const descriptor: any = Reflect.getOwnPropertyDescriptor(constructor.prototype, method);
      GrpcStreamMethod("APIKeyService", method)(constructor.prototype[method], method, descriptor);
    }
  };
}

export const A_PI_KEY_SERVICE_NAME = "APIKeyService";
