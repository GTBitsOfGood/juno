import { Body, Controller, Post, Req } from '@nestjs/common';
import {
  registerDomainBody,
  registerDomainResponse,
  verifyDomainBody,
  verifyDomainResponse,
} from 'src/models/domain';
const { client } = require('@sendgrid/client');

@Controller('domain')
export class DomainController {
  client;
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
      method: 'POST',
    };

    const response = await client.request(sendgridRequest);

    if (response.statusCode !== 200) {
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
      method: 'POST',
      body: data,
    };

    const response = await client.request(sendgridRequest);

    if (response.statusCode !== 200) {
      throw new Error('There was an error with your request');
    }
    return undefined;
  }
}
