import { Controller } from '@nestjs/common';
import {
  CreateJwtRequest,
  CreateJwtResponse,
  JwtServiceController,
  JwtServiceControllerMethods,
  ValidateJwtRequest,
  ValidateJwtResponse,
} from 'src/gen/jwt';

@Controller('jwt')
@JwtServiceControllerMethods()
export class JWTController implements JwtServiceController {
  async createJwt(request: CreateJwtRequest): Promise<CreateJwtResponse> {
    console.log(`request: ${request}`);
    return {};
  }
  validateJwt(request: ValidateJwtRequest): Promise<ValidateJwtResponse> {
    console.log(`request: ${request}`);
    throw new Error('Method not implemented.');
  }
}
