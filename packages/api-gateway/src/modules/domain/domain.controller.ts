import { Body, Controller, Inject, Post } from '@nestjs/common';
import {
  registerDomainBody,
  registerDomainResponse,
  verifyDomainBody,
  verifyDomainResponse,
} from 'src/models/domain';
import { DomainProto } from 'juno-proto';
import { DOMAIN_SERVICE_NAME } from 'juno-proto/dist/gen/domain';
import { ClientGrpc } from '@nestjs/microservices';

@Controller('domain')
export class DomainController {
  private domainService: DomainProto.DomainServiceClient;
  constructor(@Inject(DOMAIN_SERVICE_NAME) private domainClient: ClientGrpc) {}

  onModuleInit() {
    this.domainService =
      this.domainClient.getService<DomainProto.DomainServiceClient>(
        DOMAIN_SERVICE_NAME,
      );
  }
  @Post('verify')
  async verifyDomain(
    @Body() body: verifyDomainBody,
  ): Promise<verifyDomainResponse> {
    if (!body.domain) {
      throw new Error('Invalid body.');
    }
    const domain = this.domainService.verifyDomain(body);
    if (!domain) {
      throw new Error('This domain does not exist.');
    }
    return { success: true };
  }

  @Post('register')
  async registerDomain(
    @Body() body: registerDomainBody,
  ): Promise<registerDomainResponse> {
    if (!body.domain || !body.subDomain) {
      throw new Error('Invalid body.');
    }
    const domain = this.domainService.registerDomain(body);
    if (!domain) {
      throw new Error('This domain could not be registered.');
    }
    return { success: true };
  }
}
