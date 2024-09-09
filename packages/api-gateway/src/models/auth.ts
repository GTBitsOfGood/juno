import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';
import { ApiKeyProto, IdentifierProto } from 'juno-proto';

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
  @ApiProperty({ type: 'boolean' })
  apiKey: ApiKeyProto.ApiKey;

  constructor(res: ApiKeyProto.IssueApiKeyResponse) {
    this.apiKey = res.apiKey;
  }
}
