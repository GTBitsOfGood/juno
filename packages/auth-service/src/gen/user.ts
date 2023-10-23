/* eslint-disable */
import { GrpcMethod, GrpcStreamMethod } from "@nestjs/microservices";
import { Observable } from "rxjs";

export const protobufPackage = "authservice.user";

export enum UserType {
  SUPERADMIN = 0,
  ADMIN = 1,
  USER = 2,
  UNRECOGNIZED = -1,
}

export interface UserIdentifier {
  id?: number | undefined;
  email?: string | undefined;
}

export interface CreateUserParams {
  email: string;
  name: string;
  password: string;
  type: UserType;
}

export interface SetUserTypeRequest {
  identifier: UserIdentifier | undefined;
  type: UserType;
}

export interface EmptyResponse {
}

export const AUTHSERVICE_USER_PACKAGE_NAME = "authservice.user";

export interface UserServiceClient {
  setUserType(request: SetUserTypeRequest): Observable<EmptyResponse>;

  createUser(request: CreateUserParams): Observable<EmptyResponse>;
}

export interface UserServiceController {
  setUserType(request: SetUserTypeRequest): Promise<EmptyResponse> | Observable<EmptyResponse> | EmptyResponse;

  createUser(request: CreateUserParams): Promise<EmptyResponse> | Observable<EmptyResponse> | EmptyResponse;
}

export function UserServiceControllerMethods() {
  return function (constructor: Function) {
    const grpcMethods: string[] = ["setUserType", "createUser"];
    for (const method of grpcMethods) {
      const descriptor: any = Reflect.getOwnPropertyDescriptor(constructor.prototype, method);
      GrpcMethod("UserService", method)(constructor.prototype[method], method, descriptor);
    }
    const grpcStreamMethods: string[] = [];
    for (const method of grpcStreamMethods) {
      const descriptor: any = Reflect.getOwnPropertyDescriptor(constructor.prototype, method);
      GrpcStreamMethod("UserService", method)(constructor.prototype[method], method, descriptor);
    }
  };
}

export const USER_SERVICE_NAME = "UserService";
