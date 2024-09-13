import { Injectable } from '@nestjs/common';
import { EmailProto } from 'juno-proto';
import { SendGridService } from 'src/sendgrid.service';
import axios from 'axios';
import { RpcException } from '@nestjs/microservices';

@Injectable()
export class EmailService {
  constructor(private sendgrid: SendGridService) {}

  async authenticateDomain(
    req: EmailProto.AuthenticateDomainRequest,
  ): Promise<EmailProto.AuthenticateDomainResponse> {
    if (!req.domain || req.domain.length == 0) {
      throw new RpcException('Cannot register domain (no domain supplied)');
    }

    const sendGridApiKey = process.env.SENDGRID_API_KEY;

    if (!sendGridApiKey) {
      throw new RpcException(
        'Cannot register domain (SendGrid API key not in .env)',
      );
    }

    const sendGridUrl = 'https://api.sendgrid.com/v3/whitelabel/domains';

    if (process.env['NODE_ENV'] == 'test') {
      return {
        statusCode: 201,
        id: 0,
        valid: 'true',
        records: {
          mailCname: {
            valid: true,
            type: 'cname',
            host: 'mail',
            data: 'mail.sendgrid.net',
          },
          dkim1: {
            valid: true,
            type: 'cname',
            host: 's1._domainkey',
            data: 's1.domainkey.u1234.wl.sendgrid.net',
          },
          dkim2: {
            valid: true,
            type: 'cname',
            host: 's2._domainkey',
            data: 's2.domainkey.u1234.wl.sendgrid.net',
          },
        },
      };
    }

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

  async sendEmail(request: EmailProto.SendEmailRequest): Promise<void> {
    // SendGrid Client for future integration with API
    // Conditional statement used for testing without actually calling Sendgrid. Remove when perform actual integration
    if (process.env.SENDGRID_API_KEY && process.env.NODE_ENV != 'test') {
      await this.sendgrid.send({
        personalizations: [
          {
            to: request.recipients,
          },
        ],
        from: request.sender,
        content: [
          request.content[0],
          ...request.content.slice(1, request.content.length),
        ],
      });
    }
  }

  async registerSender(
    req: EmailProto.RegisterSenderRequest,
  ): Promise<EmailProto.RegisterSenderResponse> {
    if (!req.fromEmail) {
      throw new RpcException('Cannot register sender (no email supplied)');
    }
    if (!req.fromName) {
      throw new RpcException('Cannot register sender (no name supplied)');
    }
    if (!req.replyTo) {
      throw new RpcException('Cannot register sender (no reply to specified)');
    }

    const sendgridApiKey = process.env.SENDGRID_API_KEY;
    const sendgridUrl = 'https://api.sendgrid.com/v3/verified_senders';

    if (!sendgridApiKey) {
      throw new RpcException(
        'Cannot register sender (sendgrid API key is missing)',
      );
    }

    if (process.env['NODE_ENV'] == 'test') {
      return {
        statusCode: 201,
        message: 'test register success',
      };
    }
    try {
      const res = await axios.post(
        sendgridUrl,
        {
          fromEmail: req.fromEmail,
          fromName: req.fromName,
          replyTo: req.replyTo,
        },
        {
          headers: {
            Authorization: `Bearer ${sendgridApiKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      return {
        statusCode: res.status,
        message: 'Sender registered successfully',
      };
    } catch (err) {
      console.error('error registering sender:', err);
      throw new RpcException('Unable to register sender');
    }
  }
}
