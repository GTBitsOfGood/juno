import { Injectable } from '@nestjs/common';
import { LoggingProto } from 'juno-proto';

@Injectable()
export class LoggingService {
  constructor() {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async recordInfo(request: LoggingProto.RecordInfoRequest): Promise<any> {
    return {};
  }
}
