// Code generated by protoc-gen-ts_proto. DO NOT EDIT.
// versions:
//   protoc-gen-ts_proto  v1.181.2
//   protoc               v5.28.3
// source: file_bucket.proto

/* eslint-disable */
import { GrpcMethod, GrpcStreamMethod } from '@nestjs/microservices';
import { Observable } from 'rxjs';
import { FileIdentifier } from './identifiers';

export const protobufPackage = 'juno.file_service.bucket';

export interface Bucket {
  name: string;
  configId: number;
  configEnv: string;
  fileProviderName: string;
  FileServiceFile: FileIdentifier[];
}

export interface GetBucketRequest {
  name: string;
  configId: number;
  configEnv: string;
}

export interface CreateBucketRequest {
  name: string;
  configId: number;
  configEnv: string;
  fileProviderName: string;
  FileServiceFile: FileIdentifier[];
}

export interface UpdateBucketRequest {
  name: string;
  configId: number;
  configEnv: string;
  fileProviderName: string;
}

export interface DeleteBucketRequest {
  name: string;
  configId: number;
  configEnv: string;
}

export interface RegisterBucketRequest {
  name: string;
  configId: number;
  fileProviderName: string;
  configEnv: string;
  FileServiceFile: FileIdentifier[];
}

export interface RemoveBucketRequest {
  name: string;
  configId: number;
  configEnv: string;
}

export const JUNO_FILE_SERVICE_BUCKET_PACKAGE_NAME = 'juno.file_service.bucket';

export interface BucketDbServiceClient {
  getBucket(request: GetBucketRequest): Observable<Bucket>;

  createBucket(request: CreateBucketRequest): Observable<Bucket>;

  deleteBucket(request: DeleteBucketRequest): Observable<Bucket>;

  updateBucket(request: UpdateBucketRequest): Observable<Bucket>;
}

export interface BucketDbServiceController {
  getBucket(
    request: GetBucketRequest,
  ): Promise<Bucket> | Observable<Bucket> | Bucket;

  createBucket(
    request: CreateBucketRequest,
  ): Promise<Bucket> | Observable<Bucket> | Bucket;

  deleteBucket(
    request: DeleteBucketRequest,
  ): Promise<Bucket> | Observable<Bucket> | Bucket;

  updateBucket(
    request: UpdateBucketRequest,
  ): Promise<Bucket> | Observable<Bucket> | Bucket;
}

export function BucketDbServiceControllerMethods() {
  return function (constructor: Function) {
    const grpcMethods: string[] = [
      'getBucket',
      'createBucket',
      'deleteBucket',
      'updateBucket',
    ];
    for (const method of grpcMethods) {
      const descriptor: any = Reflect.getOwnPropertyDescriptor(
        constructor.prototype,
        method,
      );
      GrpcMethod('BucketDbService', method)(
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
      GrpcStreamMethod('BucketDbService', method)(
        constructor.prototype[method],
        method,
        descriptor,
      );
    }
  };
}

export const BUCKET_DB_SERVICE_NAME = 'BucketDbService';

export interface BucketFileServiceClient {
  registerBucket(request: RegisterBucketRequest): Observable<Bucket>;

  removeBucket(request: RemoveBucketRequest): Observable<Bucket>;
}

export interface BucketFileServiceController {
  registerBucket(
    request: RegisterBucketRequest,
  ): Promise<Bucket> | Observable<Bucket> | Bucket;

  removeBucket(
    request: RemoveBucketRequest,
  ): Promise<Bucket> | Observable<Bucket> | Bucket;
}

export function BucketFileServiceControllerMethods() {
  return function (constructor: Function) {
    const grpcMethods: string[] = ['registerBucket', 'removeBucket'];
    for (const method of grpcMethods) {
      const descriptor: any = Reflect.getOwnPropertyDescriptor(
        constructor.prototype,
        method,
      );
      GrpcMethod('BucketFileService', method)(
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
      GrpcStreamMethod('BucketFileService', method)(
        constructor.prototype[method],
        method,
        descriptor,
      );
    }
  };
}

export const BUCKET_FILE_SERVICE_NAME = 'BucketFileService';
