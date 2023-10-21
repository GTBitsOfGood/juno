import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';

@Controller('keys')
export class KeysController {
  @GrpcMethod('AuthService', 'issueAPIKey')
  issueAPIKey() {}

  @GrpcMethod('AuthService', 'revokeAPIKey')
  revokeAPIKey() {}
}
