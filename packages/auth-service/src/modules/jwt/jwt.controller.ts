import { Controller } from '@nestjs/common';
import { JwtProto } from 'juno-proto';

@Controller('jwt')
@JwtProto.JwtServiceControllerMethods()
export class JWTController implements JwtProto.JwtServiceController {
  async createJwt(
    request: JwtProto.CreateJwtRequest,
  ): Promise<JwtProto.CreateJwtResponse> {
    console.log(`request: ${request}`);
    return {};
  }
  validateJwt(
    request: JwtProto.ValidateJwtRequest,
  ): Promise<JwtProto.ValidateJwtResponse> {
    console.log(`requestJWT: ${request.jwt}`);
    throw new Error('Method not implemented.');
  }
}
