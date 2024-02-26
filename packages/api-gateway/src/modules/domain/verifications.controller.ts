import { Body, Controller, Post } from '@nestjs/common';
import {
  registerDomainBody,
  registerDomainResponse,
  verifyDomainBody,
  verifyDomainResponse,
} from 'src/models/domain';

@Controller('domain')
export class VerifyController {
  @Post('register')
  async registerDomain(
    @Body() body: verifyDomainBody,
  ): Promise<verifyDomainResponse> {
    return undefined;
  }

  @Post('verify')
  async verifyDomain(
    @Body() body: registerDomainBody,
  ): Promise<registerDomainResponse> {
    return undefined;
  }
}
