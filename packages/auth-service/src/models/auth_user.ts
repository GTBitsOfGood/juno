import { IsEmail, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ApiScope } from 'juno-proto/dist/gen/api_key';
import { ProjectIdentifier } from 'juno-proto/dist/gen/identifiers';

export class AuthenticateUserRequest {
  @IsNotEmpty()
  @IsEmail()
  @ApiProperty({ description: 'User email' })
  email: string;
  password: string;
}

export class CreateJwtRequest {}
export class CreateJwtResponse {}
export class ValidateJwtRequest {
  @ApiProperty({ description: 'JWT token' })
  @IsNotEmpty()
  jwt: string;
}
export class ValidateJwtResponse {}

export class ApiKey {
  @IsNotEmpty()
  @ApiProperty({ description: 'API key id' })
  id: string;
  @IsNotEmpty()
  @ApiProperty({ description: 'API key hash' })
  hash: string;
  @IsNotEmpty()
  @ApiProperty({ description: 'API key description' })
  description: string;
  @IsNotEmpty()
  @ApiProperty({ description: 'API key scopes' })
  scopes: ApiScope[];
  @ApiProperty({ description: 'API key project identifier' })
  project: ProjectIdentifier | undefined;
  @IsNotEmpty()
  @ApiProperty({ description: 'API key project environment' })
  environment: string;
}

export class IssueApiKeyRequest {
  @ApiProperty({ description: 'API key project' })
  project: ProjectIdentifier | undefined;
  @IsNotEmpty()
  @ApiProperty({ description: 'API key email' })
  email: string;
  @IsNotEmpty()
  @ApiProperty({ description: 'API key password' })
  password: string;
  @IsNotEmpty()
  @ApiProperty({ description: 'API key description' })
  description: string;
  @IsNotEmpty()
  @ApiProperty({ description: 'API key environment' })
  environment: string;
}

export class IssueApiKeyResponse {
  @ApiProperty({ description: 'API key' })
  apiKey?: ApiKey | undefined;
}

export class RevokeApiKeyRequest {}
export class RevokeApiKeyResponse {}
