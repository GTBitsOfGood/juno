import { IsNotEmpty, IsUrl } from 'class-validator';

export class verifyDomainBody {
  @IsNotEmpty()
  @IsUrl()
  domain: string;
}

export class verifyDomainResponse {}

export class registerDomainBody {
  @IsNotEmpty()
  @IsUrl()
  domain: string;

  @IsNotEmpty()
  subDomain: string;
}

export class registerDomainResponse {}
