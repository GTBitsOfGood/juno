import { IsNotEmpty } from 'class-validator';

export class RevokeAPIKeyBody {
  @IsNotEmpty()
  email: string;
  @IsNotEmpty()
  password: string;
  apiKey?: string;
  projectName?: string;
}

export class OptionalAPIKeyResponse {
  error?: string;
}
