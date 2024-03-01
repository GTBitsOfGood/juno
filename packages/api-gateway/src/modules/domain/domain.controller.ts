import { Body, Controller, Post, Req } from '@nestjs/common';
import {
  registerDomainBody,
  registerDomainResponse,
  verifyDomainBody,
  verifyDomainResponse,
} from 'src/models/domain';
import client from '../../../../../node_modules/@sendgrid/client';

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

@Controller('domain')
export class DomainController {
  onModuleInit() {
    client.setApiKey(process.env.SENDGRID_API_KEY);
  }
  @Post('verify')
  async verifyDomain(
    @Body() body: verifyDomainBody,
    @Req() request: Request,
  ): Promise<verifyDomainResponse> {
    const authToken = request.headers['Authorization']?.split(' ')[1];
    if (!authToken) {
      throw new Error('Authorization header is empty');
    }
    // middleware inputted here

    const sendgridRequest = {
      url: `/v3/whitelabel/domains/${id}/validate`,
      method: 'POST' as HttpMethod,
    };

    const response = await client.request(sendgridRequest);

    if (response[0].statusCode !== 200) {
      throw new Error('There was an error with your request');
    }

    return undefined;
  }

  @Post('register')
  async registerDomain(
    @Body() body: registerDomainBody,
    @Req() request: Request,
  ): Promise<registerDomainResponse> {
    const authToken = request.headers['Authorization']?.split(' ')[1];
    if (!authToken) {
      throw new Error('Authorization header is empty');
    }
    // midleware here

    const data = {
      domain: body.domain,
      subdomain: body.subDomain,
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
    return undefined;
  }
}
