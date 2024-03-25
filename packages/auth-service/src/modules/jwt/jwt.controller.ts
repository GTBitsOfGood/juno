import { Controller } from '@nestjs/common';
import { JwtProto } from 'juno-proto';
import * as jwt from 'jsonwebtoken';

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
    // rough implementation for middleware testing, please delete if unused
    try {
      jwt.verify(request.jwt, 'secret');
    } catch (e) {
      throw new Error(e.message);
    }
    return null;
  }
}
