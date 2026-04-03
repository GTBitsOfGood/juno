import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';
import {
  ApiKeyProto,
  AuthCommonProto,
  IdentifierProto,
  JwtProto,
} from 'juno-proto';

export class IssueApiKeyRequest {
  @ApiPropertyOptional({
    description: 'Optional description for key',
    example: 'Production API key for mobile app',
  })
  description?: string | undefined;

  @ApiProperty({
    description: 'Environment the key will be tied to',
    example: 'production',
  })
  @IsNotEmpty()
  environment: string;

  @IsNotEmpty()
  @ApiProperty({
    description: 'Project identifier',
    example: { name: 'my-project' },
  })
  project: IdentifierProto.ProjectIdentifier;
}

export class IssueApiKeyResponse {
  @ApiProperty({
    description:
      'The generated API key value (store immediately, not retrievable again)',
    example: 'a1b2c3d4e5f6...',
  })
  apiKey: string;

  @ApiProperty({
    description: 'Environment this key was issued for',
    example: 'production',
  })
  environment: string;

  @ApiProperty({
    description: 'Description provided at creation',
    example: 'Production API key for mobile app',
  })
  description: string;

  @ApiProperty({
    description: 'ISO timestamp of key creation',
    example: '2026-01-01T00:00:00.000Z',
  })
  createdAt: string;

  @ApiProperty({ description: 'project identifier for the API key' })
  project: string;

  constructor(res: ApiKeyProto.IssueApiKeyResponse) {
    this.apiKey = res.apiKey;
    this.environment = res.info?.environment;
    this.description = res.info?.description;
    this.createdAt = res.info?.createdAt;
    this.project = res.info.project.id.toString();
  }
}

// string id = 1;
// string hash = 2;
// string description = 3;
// repeated ApiScope scopes = 4;
// identifiers.ProjectIdentifier project = 5;
// string environment = 6;
// string created_at = 7;

export class ApiKey {
  @ApiProperty({
    description: "The API key's ID in the databse",
    example: '5',
  })
  id: string;

  @ApiProperty({
    description:
      'The generated API key value (store immediately, not retrievable again)',
    example: 'a1b2c3d4e5f6...',
  })
  hash: string;

  @ApiProperty({
    description: 'Description provided at creation',
    example: 'Production API key for mobile app',
  })
  description: string;

  @ApiProperty({
    description: 'Scopes tied to this API key',
    example: '["read:projects", "write:analytics"]',
    isArray: true,
  })
  scopes: string;

  @ApiProperty({ description: 'project identifier for the API key' })
  project: string;

  @ApiProperty({
    description: 'Environment this key was issued for',
    example: 'production',
  })
  environment: string;

  @ApiProperty({
    description: 'ISO timestamp of key creation',
    example: '2026-01-01T00:00:00.000Z',
  })
  createdAt: string;

  constructor(res: AuthCommonProto.ApiKey) {
    this.id = res.id;
    this.hash = res.hash;
    this.description = res.description;
    this.environment = res.environment;
    this.project = res.project.id.toString();
    this.createdAt = res.createdAt;
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
    type: ApiKey,
    isArray: true,
    description: 'List of API keys belonging to a project',
  })
  keys: AuthCommonProto.ApiKey[];

  constructor(res: ApiKeyProto.GetAllApiKeysResponse) {
    this.keys = (res.keys ?? []).map((key) => ({
      ...key,
      scopes: key.scopes ?? [],
      project: key.project
        ? { id: Number(key.project.id), name: key.project.name }
        : undefined,
    }));
  }
}
