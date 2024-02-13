import { Catch, RpcExceptionFilter } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Observable, throwError } from 'rxjs';

@Catch(RpcException)
export class CustomRpcExceptionFilter
  implements RpcExceptionFilter<RpcException>
{
  catch(exception: RpcException): Observable<any> {
    // Extract and log the error information
    const error = exception.getError();
    // console.error('RPC Exception:', error);

    // Propagate the original exception back to the caller
    // In a microservices context, NestJS automatically serializes exceptions for transport
    return throwError(() => exception);
  }
}
