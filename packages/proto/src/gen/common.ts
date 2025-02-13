// Code generated by protoc-gen-ts_proto. DO NOT EDIT.
// versions:
//   protoc-gen-ts_proto  v1.181.2
//   protoc               v5.28.2
// source: common.proto

/* eslint-disable */

export const protobufPackage = 'juno.common';

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
  projectIds: number[];
}

export const JUNO_COMMON_PACKAGE_NAME = 'juno.common';
