// Code generated by protoc-gen-ts_proto. DO NOT EDIT.
// versions:
//   protoc-gen-ts_proto  v1.181.2
//   protoc               v5.28.2
// source: file_bucket.proto

/* eslint-disable */
import { GrpcMethod, GrpcStreamMethod } from '@nestjs/microservices';
import { Observable } from 'rxjs';

export const protobufPackage = 'juno.file_service.config';

export interface Bucket {}

export interface GetBucketRequest {}

export interface CreateBucketRequest {}

export interface UpdateBucketRequest {}

export interface DeleteBucketRequest {}

export const JUNO_FILE_SERVICE_CONFIG_PACKAGE_NAME = 'juno.file_service.config';

export interface BucketBucketDbServiceClient {
  getBucket(request: GetBucketRequest): Observable<Bucket>;

  createBucket(request: CreateBucketRequest): Observable<Bucket>;

  deleteBucket(request: DeleteBucketRequest): Observable<Bucket>;

  updateBucket(request: UpdateBucketRequest): Observable<Bucket>;
}

export interface BucketBucketDbServiceController {
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

export function BucketBucketDbServiceControllerMethods() {
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
      GrpcMethod('BucketBucketDbService', method)(
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
      GrpcStreamMethod('BucketBucketDbService', method)(
        constructor.prototype[method],
        method,
        descriptor,
      );
    }
  };
}

export const BUCKET_BUCKET_DB_SERVICE_NAME = 'BucketBucketDbService';