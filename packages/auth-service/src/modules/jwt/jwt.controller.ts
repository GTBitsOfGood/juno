import { Controller } from '@nestjs/common';
import {
  CreateJWTRequest,
  CreateJWTResponse,
  JWTServiceController,
  ValidateJWTRequest,
  ValidateJWTResponse,
} from 'src/gen/jwt';

@Controller('jwt')
export class JWTController implements JWTServiceController {
  createJwt(request: CreateJWTRequest): Promise<CreateJWTResponse> {
    console.log(`request: ${request}`);
    throw new Error('Method not implemented.');
  }
  validateJwt(request: ValidateJWTRequest): Promise<ValidateJWTResponse> {
    console.log(`request: ${request}`);
    throw new Error('Method not implemented.');
  }
}
