import { Controller } from '@nestjs/common';
import { LoggingService } from './logging.service';
import { LoggingProto } from 'juno-proto';

@Controller()
@LoggingProto.LoggingServiceControllerMethods()
export class LoggingController
  implements LoggingProto.LoggingServiceController
{
  constructor(private readonly loggingService: LoggingService) {}
  async recordError(
    request: LoggingProto.ErrorLogRequest,
  ): Promise<LoggingProto.ErrorLogResponse> {
    if (!request.msg) {
      console.log('Invalid parameters');
    } else {
      try {
        await this.loggingService.recordError(request);
        return {};
      } catch (error) {
        console.log('Error occured');
      }
    }
  }
  async recordInfo(
    request: LoggingProto.RecordInfoRequest,
  ): Promise<LoggingProto.RecordInfoResponse> {
    // Since we don't want to return exceptions to terminate logs, we should instead console log values
    if (!request.msg) {
      console.log('Invalid parameters');
    } else {
      try {
        await this.loggingService.recordInfo(request);
        return {};
      } catch (error) {
        console.log('Error occured');
      }
    }
  }
}
