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
        this.loggingService = this.client.getService<LoggingService>('LoggingService');
    }

    recordError(message: string) {
        // TODO: currently doing nothing here, but want to actually log
        return;
    }
}
