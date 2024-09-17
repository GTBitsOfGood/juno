import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';
import { ApiKeyProto, IdentifierProto, JwtProto } from 'juno-proto';

export class IssueApiKeyRequest {
  @ApiProperty({ description: 'Issuing user email' })
  @IsNotEmpty()
  email: string;
  @ApiProperty({ description: 'Issuing user password' })
  @IsNotEmpty()
  password: string;
  @ApiProperty({ description: 'Optional description for key' })
  description?: string | undefined;
  @ApiProperty({ description: 'Environemnt this key should be tied to' })
  @IsNotEmpty()
  environment: string;

  @IsNotEmpty()
  project: IdentifierProto.ProjectIdentifier;
}

export class IssueApiKeyResponse {
  @ApiProperty({ type: 'string' })
  apiKey: string;

  constructor(res: ApiKeyProto.IssueApiKeyResponse) {
    this.apiKey = res.apiKey;
  }
}

export class IssueJWTResponse {
  token: string;

  constructor(res: JwtProto.CreateJwtResponse) {
    this.token = res.jwt;
  }
}
