import { Controller } from '@nestjs/common';
import { HealthProto } from 'juno-proto';
import { Observable } from 'rxjs';

@Controller()
@HealthProto.HealthControllerMethods()
export class HealthController implements HealthProto.HealthController {
  Watch(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    request: HealthProto.HealthCheckRequest,
  ): Observable<HealthProto.HealthCheckResponse> {
    throw new Error('Method not implemented.');
  }
  Check(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _request: HealthProto.HealthCheckRequest,
  ):
    | HealthProto.HealthCheckResponse
    | Promise<HealthProto.HealthCheckResponse> {
    return {
      status: HealthProto.HealthCheckResponse_ServingStatus.SERVING,
    };
  }
}
