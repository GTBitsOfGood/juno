import { status } from '@grpc/grpc-js';
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Response } from 'express';
import * as Sentry from '@sentry/nestjs';

interface ErrorInfo {
  code: status;
  message: string;
}

function isErrorInfo(error: any): error is ErrorInfo {
  return error.code !== undefined && error.message !== undefined;
}

@Catch(RpcException, Error)
export class RpcExceptionFilter implements ExceptionFilter {
  catch(exception: RpcException | Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    if (exception instanceof HttpException) {
      if (exception.getStatus() >= 500) {
        Sentry.captureException(exception);
      }
      response.status(exception.getStatus()).send(exception.getResponse());
      return;
    } else if (isErrorInfo(exception)) {
      response.status(rpcStatusToHttp(exception.code)).send(exception.message);
    } else {
      let ex: RpcException;
      if (!(exception instanceof RpcException)) {
        ex = new RpcException(exception);
      } else {
        ex = exception;
      }
      const error: any = ex.getError();
      if (rpcStatusToHttp(error.code) >= 500) {
        Sentry.captureException(exception);
      }
      response.status(rpcStatusToHttp(error.code)).send(ex.message);
    }
  }
}

function rpcStatusToHttp(rpc: status): number {
  switch (rpc) {
    case status.OK:
      return 200;
    case status.PERMISSION_DENIED:
      return 401;
    case status.FAILED_PRECONDITION:
      return 400;
    case status.NOT_FOUND:
      return 404;
    case status.UNAUTHENTICATED:
      return 401;
    default:
      return 500;
  }
}
