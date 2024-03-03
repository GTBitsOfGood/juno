import { Injectable } from '@nestjs/common';
import { Domain } from '@prisma/client';
import { DomainProto } from 'juno-proto';
import { PrismaService } from 'src/prisma.service';

type HttpMethod =
  | 'get'
  | 'GET'
  | 'post'
  | 'POST'
  | 'put'
  | 'PUT'
  | 'patch'
  | 'PATCH'
  | 'delete'
  | 'DELETE';

@Injectable()
export class DomainService {
  constructor(private prisma: PrismaService) {}

  async verifyDomain(
    request: DomainProto.VerifyDomainRequest,
    client: any,
  ): Promise<Domain> {
    const domainEntry = await this.prisma.domain.findUnique({
      where: { domain: request.domain },
    });
    if (!domainEntry) {
      throw new Error('This domain is not valid.');
    }

    const sendgridRequest = {
      url: `/v3/whitelabel/domains/${domainEntry.id}/validate`,
      method: 'POST' as HttpMethod,
    };

    const response = await client.request(sendgridRequest);

    if (response[0].statusCode !== 200) {
      throw new Error('There was an error with your request');
    }
    return domainEntry;
  }

  async registerDomain(
    request: DomainProto.RegisterDomainRequest,
    client: any,
  ): Promise<Domain> {
    const data = {
      domain: request.domain,
      subdomain: request.subDomain,
    };

    const sendgridRequest = {
      url: `/v3/whitelabel/domains`,
      method: 'POST' as HttpMethod,
      body: data,
    };

    const response = await client.request(sendgridRequest);
    if (response[0].statusCode !== 200) {
      throw new Error('There was an error with your request');
    }
    const domain = await this.prisma.domain.create({
      data: {
        domain: request.domain,
        subdomain: request.subDomain,
        id: response[0].body['id'],
      },
    });
    return domain;
  }
}
