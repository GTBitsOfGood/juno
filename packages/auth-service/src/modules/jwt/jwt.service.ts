import { Injectable } from '@nestjs/common';
import {
  CreateJwtInfo,
  CreateJwtProjectInfo,
  InternalJwtServiceController,
  JwtForVerificationInfo,
  VerificationInfo,
} from 'src/gen/jwt';
import jwt, { JwtPayload } from 'jsonwebtoken';

type JunoJwtPayload = JwtPayload & CreateJwtProjectInfo;

@Injectable()
export class JWTService implements InternalJwtServiceController {
  createJwtFromProjectInfo(projectInfo: CreateJwtProjectInfo): CreateJwtInfo {
    const token = jwt.sign(projectInfo, process.env.JWT_SECRET ?? 'secret', {
      expiresIn: '1h',
    });

    return {
      jwt: token,
    };
  }

  verifyJwt(jwtInfo: JwtForVerificationInfo): VerificationInfo {
    try {
      const token = jwtInfo.jwt;
      const tokenData: CreateJwtProjectInfo = <JunoJwtPayload>(
        jwt.verify(token, process.env.JWT_SECRET ?? 'secret')
      );

      return {
        verified: true,
        hashedApiKey: tokenData.hashedApiKey,
      };
    } catch {
      return {
        verified: false,
      };
    }
  }
}
