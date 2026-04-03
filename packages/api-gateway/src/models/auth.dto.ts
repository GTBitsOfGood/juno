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
    example: ['read:projects', 'write:analytics'],
    type: [String],
  })
  scopes: string[];

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
    this.scopes = res.scopes
      ? res.scopes.map((scope) => scope.toString())
      : [''];
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

export class PaginationParams {
  @ApiProperty({
    description: 'first page of results',
    example: '/auth/key/?offset=0&limit=5',
  })
  first: string;
  @ApiProperty({
    description: 'previous page of results',
    example: '/auth/key/?offset=15&limit=5',
  })
  prev: string;
  @ApiProperty({
    description: 'next page of results',
    example: '/auth/key/?offset=20&limit=5',
  })
  next: string;
  @ApiProperty({
    description: 'last page of results',
    example: '/auth/key/?offset=25&limit=5',
  })
  last: string;

  constructor(res: {
    first: string;
    prev: string;
    next: string;
    last: string;
  }) {
    this.first = res.first;
    this.prev = res.prev;
    this.next = res.next;
    this.last = res.last;
  }
}
export class GetAllApiKeysResponse {
  @ApiProperty({
    type: ApiKey,
    isArray: true,
    description: 'List of API keys belonging to a project',
  })
  keys: ApiKey[];

  @ApiProperty({
    type: PaginationParams,
    description: 'Pagination parameters',
  })
  links: PaginationParams;

  constructor(res: {
    keys: AuthCommonProto.ApiKey[];
    links: PaginationParams;
  }) {
    this.keys = (res.keys ?? []).map((key) => new ApiKey(key));
    this.links = res.links;
  }
}
