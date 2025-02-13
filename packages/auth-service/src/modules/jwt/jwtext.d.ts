import { JwtPayload } from 'jsonwebtoken';

declare module 'jsonwebtoken' {
  export interface ApiKeyHashJWTPayload extends JwtPayload {
    apiKeyHash: string;
  }

  export interface UserJWTPayload extends JwtPayload {
    user: CommonProto.User;
  }
}
