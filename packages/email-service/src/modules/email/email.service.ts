import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { EmailProto } from 'juno-proto';
import { SendGridService } from 'src/sendgrid.service';
import axios from 'axios';
import { ClientGrpc, RpcException } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';

const { EMAIL_DB_SERVICE_NAME } = EmailProto;

@Injectable()
export class EmailService implements OnModuleInit {
  private emailService: EmailProto.EmailDbServiceClient;
  constructor(
    private sendgrid: SendGridService,
    @Inject(EMAIL_DB_SERVICE_NAME) private emailClient: ClientGrpc,
  ) {}

  onModuleInit() {
    this.emailService =
      this.emailClient.getService<EmailProto.EmailDbServiceClient>(
        EMAIL_DB_SERVICE_NAME,
      );
  }

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
      this.emailService.createEmailDomain({
        domain: req.domain,
        subdomain: req.subdomain,
        sendgridId: 0,
        configId: 0,
      });
      return {
        statusCode: 201,
        id: 0,
        valid: 'true',
        records: TEST_SENDGRID_RECORDS,
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
            cc: request.cc,
            bcc: request.bcc,
          },
        ],
        from: {
          email: request.sender.email,
          name: request.sender.name,
        },
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

  async verifyDomain(
    req: EmailProto.VerifyDomainRequest,
  ): Promise<EmailProto.VerifyDomainResponse> {
    console.log(`verifying`);
    const domain = await lastValueFrom(
      this.emailService.getEmailDomain({
        domain: req.domain,
      }),
    );

    console.log(`verifying: ${JSON.stringify(domain)}`);

    const id = domain.sendgridId;

    const sendgridApiKey = process.env.SENDGRID_API_KEY;
    const sendgridUrl = `https://api.sendgrid.com/v3/whitelabel/domains/${id}/val`;

    if (!sendgridApiKey) {
      throw new RpcException(
        'Cannot verify domain (sendgrid API key is missing)',
      );
    }

    if (process.env['NODE_ENV'] == 'test') {
      return {
        statusCode: 200,
        valid: true,
        records: TEST_SENDGRID_RECORDS,
        id,
      };
    }

    try {
      const response = await axios.post(sendgridUrl, {
        headers: {
          Authorization: `Bearer ${sendgridApiKey}`,
          'Content-Type': 'application/json',
        },
      });

      const records: EmailProto.SendGridDnsRecords =
        response.data.validation_results;

      return {
        statusCode: response.status,
        id,
        valid: response.data.valid,
        records,
      };
    } catch (error) {
      console.error('Error registering domain:', error);
      throw new RpcException('Failed to register domain');
    }
  }
}

const TEST_SENDGRID_RECORDS = {
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
};
