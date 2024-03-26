import { Injectable } from '@nestjs/common';
import { LoggingProto } from 'juno-proto';

@Injectable()
export class LoggingService {
  constructor() {}

  async recordInfo(request: LoggingProto.RecordInfoRequest): Promise<any> {
    return {};
  }
}
