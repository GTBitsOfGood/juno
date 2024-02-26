import { IsNotEmpty } from 'class-validator';

export class verifyDomainBody {
  @IsNotEmpty()
  domain: string;
}

export class verifyDomainResponse {}

export class registerDomainBody {
  @IsNotEmpty()
  domain: string;

  @IsNotEmpty()
  subDomain: string;
}

export class registerDomainResponse {}
