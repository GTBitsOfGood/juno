import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';
import {
  ApiKeyProto,
  AuthCommonProto,
  IdentifierProto,
  JwtProto,
} from 'juno-proto';

export class IssueApiKeyRequest {
  @ApiProperty({ description: 'Optional description for key' })
  description?: string | undefined;

  @ApiProperty({ description: 'Environment the key will be tied to' })
  @IsNotEmpty()
  environment: string;

  @IsNotEmpty()
  @ApiProperty({ description: 'Project identifier' })
  project: IdentifierProto.ProjectIdentifier;
}

export class IssueApiKeyResponse {
  @ApiProperty({ type: 'string', description: 'The generated API key' })
  apiKey: string;

  constructor(res: ApiKeyProto.IssueApiKeyResponse) {
    this.apiKey = res.apiKey;
  }
}

export class IssueJWTResponse {
  @ApiProperty({ type: 'string', description: 'Created JWT token' })
  token: string;

  constructor(res: JwtProto.CreateJwtResponse) {
    this.token = res.jwt;
  }
}

export class GetAllApiKeysResponse {
  @ApiProperty({
    isArray: true,
    description: 'List of API keys belonging to a project',
  })
  keys: AuthCommonProto.ApiKey[];

  constructor(res: ApiKeyProto.GetAllApiKeysResponse) {
    this.keys = res.keys;
  }
}
