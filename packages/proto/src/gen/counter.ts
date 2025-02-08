// Code generated by protoc-gen-ts_proto. DO NOT EDIT.
// versions:
//   protoc-gen-ts_proto  v1.181.2
//   protoc               v5.28.2
// source: counter.proto

/* eslint-disable */
import { GrpcMethod, GrpcStreamMethod } from '@nestjs/microservices';
import { Observable } from 'rxjs';

export const protobufPackage = 'juno.counter';

export interface CreateCounterRequest {
  id: string;
}

export interface IncrementCounterRequest {
  id: string;
}

export interface DecrementCounterRequest {
  id: string;
}

export interface ResetCounterRequest {
  id: string;
}

export interface GetCounterRequest {
  id: string;
}

export interface Counter {
  id: string;
  value: number;
}

export const JUNO_COUNTER_PACKAGE_NAME = 'juno.counter';

export interface CounterServiceClient {
  createCounter(request: CreateCounterRequest): Observable<Counter>;

  incrementCounter(request: IncrementCounterRequest): Observable<Counter>;

  decrementCounter(request: DecrementCounterRequest): Observable<Counter>;

  resetCounter(request: ResetCounterRequest): Observable<Counter>;

  getCounter(request: GetCounterRequest): Observable<Counter>;
}

export interface CounterServiceController {
  createCounter(
    request: CreateCounterRequest,
  ): Promise<Counter> | Observable<Counter> | Counter;

  incrementCounter(
    request: IncrementCounterRequest,
  ): Promise<Counter> | Observable<Counter> | Counter;

  decrementCounter(
    request: DecrementCounterRequest,
  ): Promise<Counter> | Observable<Counter> | Counter;

  resetCounter(
    request: ResetCounterRequest,
  ): Promise<Counter> | Observable<Counter> | Counter;

  getCounter(
    request: GetCounterRequest,
  ): Promise<Counter> | Observable<Counter> | Counter;
}

export function CounterServiceControllerMethods() {
  return function (constructor: Function) {
    const grpcMethods: string[] = [
      'createCounter',
      'incrementCounter',
      'decrementCounter',
      'resetCounter',
      'getCounter',
    ];
    for (const method of grpcMethods) {
      const descriptor: any = Reflect.getOwnPropertyDescriptor(
        constructor.prototype,
        method,
      );
      GrpcMethod('CounterService', method)(
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
      GrpcStreamMethod('CounterService', method)(
        constructor.prototype[method],
        method,
        descriptor,
      );
    }
  };
}

export const COUNTER_SERVICE_NAME = 'CounterService';
