import { Controller } from '@nestjs/common';
import { DomainProto } from 'juno-proto';
import { DomainService } from './domain.service';
import client from '../../../../../node_modules/@sendgrid/client';

@Controller()
@DomainProto.DomainServiceControllerMethods()
export class DomainDbController implements DomainProto.DomainServiceController {
  constructor(private readonly domainService: DomainService) {
    client.setApiKey(process.env.SENDGRID_API_KEY);
  }
  async verifyDomain(
    request: DomainProto.VerifyDomainRequest,
  ): Promise<DomainProto.VerifyDomainResponse> {
    return await this.domainService.verifyDomain(request, client);
  }
  async registerDomain(
    request: DomainProto.RegisterDomainRequest,
  ): Promise<DomainProto.RegisterDomainResponse> {
    return await this.domainService.registerDomain(request, client);
  }
}
