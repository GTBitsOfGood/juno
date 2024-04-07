import { Controller } from '@nestjs/common';
import { JwtProto } from 'juno-proto';
import * as jwt from 'jsonwebtoken';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import {
  CreateJwtRequest,
  CreateJwtResponse,
  ValidateJwtRequest,
  ValidateJwtResponse,
} from 'juno-proto/dist/gen/jwt';

@ApiTags('health')
@Controller('jwt')
@JwtProto.JwtServiceControllerMethods()
export class JWTController implements JwtProto.JwtServiceController {
  @ApiOperation({ summary: 'Create a JWT' })
  @ApiResponse({ status: 200, description: 'JWT successfully created.', type: CreateJwtResponse })
  @ApiBody({ type: CreateJwtRequest, description: 'Payload to create a new JWT' })
  async createJwt(
    request: JwtProto.CreateJwtRequest,
  ): Promise<JwtProto.CreateJwtResponse> {
    console.log(`request: ${request}`);
    return {};
  }

  @ApiOperation({ summary: 'Validate a JWT' })
  @ApiResponse({ status: 200, description: 'JWT successfully validated.', type: ValidateJwtRequest })
  @ApiBody({ type: ValidateJwtResponse, description: 'Payload to validate a JWT' })
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
