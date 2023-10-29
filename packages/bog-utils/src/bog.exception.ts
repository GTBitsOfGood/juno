import { HttpException, HttpStatus } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';

export class BogException extends HttpException {
  constructor(exception: HttpException | RpcException) {
    super(
      BogException.getMessage(exception),
      BogException.getStatusCode(exception),
    );
  }

  private static hasMessage(obj: any): obj is { message: string } {
    return obj.message;
  }

  private static getMessage(
    exception: HttpException | RpcException,
  ): string | Record<string, any> {
    if (exception instanceof RpcException) {
      const rpcError = exception.getError();

      if (typeof rpcError === 'string') {
        return rpcError;
      } else if (typeof rpcError === 'object' && rpcError !== null) {
        return this.hasMessage(rpcError)
          ? rpcError.message
          : JSON.stringify(rpcError);
      } else {
        return 'Unknown RPC Error';
      }
    }

    return exception.getResponse();
  }

  private static getStatusCode(
    exception: HttpException | RpcException,
  ): number {
    if (exception instanceof RpcException) {
      return HttpStatus.INTERNAL_SERVER_ERROR;
    }

    return exception.getStatus();
  }
}
