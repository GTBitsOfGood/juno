import { status } from '@grpc/grpc-js';
import { Catch, ArgumentsHost } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { RpcException } from '@nestjs/microservices';
import * as Sentry from '@sentry/node';
import { throwError } from 'rxjs';

interface ErrorInfo {
  code: status;
  message: string;
}

function isErrorInfo(error: any): error is ErrorInfo {
  return error.code !== undefined && error.message !== undefined;
}

@Catch()
export class SentryFilter extends BaseExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    if (!(exception instanceof RpcException) && !isErrorInfo(exception)) {
      Sentry.captureException(exception);
      super.catch(exception, host);
    } else if (exception instanceof RpcException) {
      return throwError(() => exception.getError());
    } else if (isErrorInfo(exception)) {
      return throwError(() => exception);
    }
  }
}
