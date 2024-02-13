/* eslint-disable */
import { GrpcMethod, GrpcStreamMethod } from '@nestjs/microservices';
import { Observable } from 'rxjs';
import { ProjectIdentifier, UserIdentifier } from './identifiers';

export const protobufPackage = 'juno.user';

export enum UserType {
  SUPERADMIN = 0,
  ADMIN = 1,
  USER = 2,
  UNRECOGNIZED = -1,
}

export interface User {
  id: number;
  email: string;
  name: string;
  type: UserType;
}

export interface UserPassword {
  password: string;
}

export interface CreateUserRequest {
  email: string;
  name: string;
  password: string;
  type: UserType;
}

export interface UserUpdateParams {
  email?: string | undefined;
  name?: string | undefined;
  password?: string | undefined;
  type?: UserType | undefined;
}

export interface UpdateUserRequest {
  userIdentifier: UserIdentifier | undefined;
  updateParams: UserUpdateParams | undefined;
}

export interface LinkProjectToUserRequest {
  project: ProjectIdentifier | undefined;
  user: UserIdentifier | undefined;
}

export const JUNO_USER_PACKAGE_NAME = 'juno.user';

export interface UserServiceClient {
  getUser(request: UserIdentifier): Observable<User>;

  createUser(request: CreateUserRequest): Observable<User>;

  updateUser(request: UpdateUserRequest): Observable<User>;

  deleteUser(request: UserIdentifier): Observable<User>;

  linkProject(request: LinkProjectToUserRequest): Observable<User>;

  getUserPassword(request: UserIdentifier): Observable<UserPassword>;
}

export interface UserServiceController {
  getUser(request: UserIdentifier): Promise<User> | Observable<User> | User;

  createUser(
    request: CreateUserRequest,
  ): Promise<User> | Observable<User> | User;

  updateUser(
    request: UpdateUserRequest,
  ): Promise<User> | Observable<User> | User;

  deleteUser(request: UserIdentifier): Promise<User> | Observable<User> | User;

  linkProject(
    request: LinkProjectToUserRequest,
  ): Promise<User> | Observable<User> | User;

  getUserPassword(
    request: UserIdentifier,
  ): Promise<UserPassword> | Observable<UserPassword> | UserPassword;
}

export function UserServiceControllerMethods() {
  return function (constructor: Function) {
    const grpcMethods: string[] = [
      'getUser',
      'createUser',
      'updateUser',
      'deleteUser',
      'linkProject',
      'getUserPassword',
    ];
    for (const method of grpcMethods) {
      const descriptor: any = Reflect.getOwnPropertyDescriptor(
        constructor.prototype,
        method,
      );
      GrpcMethod('UserService', method)(
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
      GrpcStreamMethod('UserService', method)(
        constructor.prototype[method],
        method,
        descriptor,
      );
    }
  };
}

export const USER_SERVICE_NAME = 'UserService';
