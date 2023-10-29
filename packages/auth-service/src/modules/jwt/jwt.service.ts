import { Injectable } from '@nestjs/common';
import {
  CreateJwtInfo,
  CreateJwtProjectInfo,
  InternalJwtServiceController,
  JwtForVerificationInfo,
  VerificationInfo,
} from 'src/gen/jwt';
import jwt from 'jsonwebtoken';

@Injectable()
export class JWTService implements InternalJwtServiceController {
  createJwtFromProjectInfo(projectInfo: CreateJwtProjectInfo): CreateJwtInfo {
    const { projectId, scopes, hashedApiKey } = projectInfo;

    const token = jwt.sign(
      {
        projectId,
        hashedApiKey,
        scopes,
      },
      process.env.JWT_SECRET ?? 'secret',
      { expiresIn: '1h' },
    );

    return {
      jwt: token,
    };
  }

  verifyJwt(jwtInfo: JwtForVerificationInfo): VerificationInfo {
    const token = jwtInfo.jwt;
    jwt.verify(token, process.env.JWT_SECRET ?? 'secret');

    return {
      verified: true,
    };
  }
}
