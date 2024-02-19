import { RpcException } from '@nestjs/microservices';
import { Prisma } from '@prisma/client';
import { Observable, throwError } from 'rxjs';
import { Catch, RpcExceptionFilter } from '@nestjs/common';
import { status } from '@grpc/grpc-js';

function mapPrismaErrorToRpcException(
  error: Prisma.PrismaClientKnownRequestError,
): RpcException {
  console.log(`prisma code: ${error.code}`);
  switch (error.code) {
    case 'P2002':
      return new RpcException({
        code: status.ALREADY_EXISTS,
        message: 'The resource already exists.',
      });
    case 'P2025':
      return new RpcException({
        code: status.NOT_FOUND,
        message: 'The resource does not exist.',
      });
    case 'P2003':
      return new RpcException({
        code: status.FAILED_PRECONDITION,
        message: 'Foreign key constraint failed.',
      });
    // Might want to handle new cases here
    default:
      return new RpcException({
        code: status.UNKNOWN,
        message: 'An unknown database error occurred.',
      });
  }
}

@Catch(RpcException, Prisma.PrismaClientKnownRequestError, Error)
export class CustomRpcExceptionFilter
  implements
    RpcExceptionFilter<
      RpcException | Prisma.PrismaClientKnownRequestError | Error
    >
{
  catch(
    exception: RpcException | Prisma.PrismaClientKnownRequestError | Error,
  ): Observable<any> {
    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      const rpcException = mapPrismaErrorToRpcException(exception);
      console.error('Prisma Error:', exception.message);
      return throwError(() => rpcException.getError());
    } else if (exception instanceof RpcException) {
      return throwError(() => exception.getError());
    } else {
      console.error('Unexpected Error:', exception.message);
      return throwError(() =>
        new RpcException('An unexpected error occurred').getError(),
      );
    }
  }
}
