import { Injectable } from '@nestjs/common';
import { EmailProto } from 'juno-proto';
import axios from 'axios';
import { RpcException } from '@nestjs/microservices';

@Injectable()
export class AppService {
  async authenticateDomain(
    req: EmailProto.AuthenticateDomainRequest,
  ): Promise<EmailProto.AuthenticateDomainResponse> {
    if (!req.domain) {
      throw new RpcException('Cannot register domain (no domain supplied)');
    }

    const sendGridApiKey = process.env.SENDGRID_API_KEY;

    if (!sendGridApiKey) {
      throw new RpcException(
        'Cannot register domain (SendGrid API key not in .env)',
      );
    }

    const sendGridUrl = 'https://api.sendgrid.com/v3/whitelabel/domains';

    try {
      const response = await axios.post(
        sendGridUrl,
        {
          domain: req.domain,
          subdomain: req.subdomain,
        },
        {
          headers: {
            Authorization: `Bearer ${sendGridApiKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      const records: EmailProto.SendGridDnsRecords = response.data.dns;

      return {
        statusCode: response.status,
        id: response.data.id,
        valid: response.data.valid,
        records,
      };
    } catch (error) {
      console.error('Error registering domain:', error);
      throw new RpcException('Failed to register domain');
    }
  }
}
