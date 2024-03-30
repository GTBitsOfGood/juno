import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { Observable } from 'rxjs';

interface LoggingService {
  recordError(errorLogRequest: { message: string }): Observable<void>;
}

@Injectable()
export class AppService implements OnModuleInit {
  private loggingService: LoggingService;

  constructor(@Inject('LOGGING_SERVICE') private client: ClientGrpc) {}

  onModuleInit() {
    this.loggingService =
      this.client.getService<LoggingService>('LoggingService');
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  recordError(message: string) {
    // TODO: currently doing nothing here, but want to actually log the error
    return;
  }
}
