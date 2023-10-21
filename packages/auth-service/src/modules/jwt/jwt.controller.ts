import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';

@Controller('jwt')
export class JWTController {
  @GrpcMethod('AuthService', 'createJWT')
  getUsers() {}

  @GrpcMethod('AuthService', 'validateJWT')
  validateJWT() {}
}
