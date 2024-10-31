import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { EmailProto } from 'juno-proto';
import { SendGridService } from 'src/sendgrid.service';
import axios from 'axios';
import { ClientGrpc, RpcException } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { MailDataRequired } from '@sendgrid/mail';
import { status } from '@grpc/grpc-js';

const { EMAIL_DB_SERVICE_NAME } = EmailProto;

@Injectable()
export class EmailService implements OnModuleInit {
  private emailService: EmailProto.EmailDbServiceClient;
  constructor(@Inject(EMAIL_DB_SERVICE_NAME) private emailClient: ClientGrpc) {}

  onModuleInit() {
    this.emailService =
      this.emailClient.getService<EmailProto.EmailDbServiceClient>(
        EMAIL_DB_SERVICE_NAME,
      );
  }

  async setup(
    request: EmailProto.SetupRequest,
  ): Promise<EmailProto.SetupResponse> {
    const config = await lastValueFrom(
      this.emailService.createEmailServiceConfig(request),
    );
    if (!config) {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: 'Failed to create email service config',
      });
    }
    return {
      success: true,
      config,
    };
  }

  async authenticateDomain(
    req: EmailProto.AuthenticateDomainRequest,
  ): Promise<EmailProto.AuthenticateDomainResponse> {
    if (!req.domain || req.domain.length == 0) {
      throw new RpcException('Cannot register domain (no domain supplied)');
    }

    const config = await lastValueFrom(
      this.emailService.getEmailServiceConfig({
        id: Number(req.configId),
        environment: req.configEnvironment,
      }),
    );

    const sendGridApiKey = config.sendgridKey;

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
        configId: req.configId,
        configEnvironment: req.configEnvironment,
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

      const records: EmailProto.SendGridDnsRecords = {
        dkim1: response.data.dns.dkim1,
        dkim2: response.data.dns.dkim2,
        mailCname: response.data.dns.mail_cname,
      };

      // await lastValueFrom(
      //   this.emailService.createEmailDomain({
      //     domain: req.domain,
      //     subdomain: req.subdomain,
      //     sendgridId: response.data.id,
      //     configId: req.configId,
      //     configEnvironment: req.configEnvironment,
      //   }),
      // );

      return {
        statusCode: response.status,
        id: response.data.id,
        valid: response.data.valid,
        records,
      };
    } catch (error) {
      if (error instanceof RpcException) {
        throw error;
      }
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: JSON.stringify(error),
      });
    }
  }

  async sendEmail(request: EmailProto.SendEmailRequest): Promise<void> {
    const config = await lastValueFrom(
      this.emailService.getEmailServiceConfig({
        id: request.configId,
        environment: request.configEnvironment,
      }),
    );

    const sendGridApiKey = config.sendgridKey;
    // SendGrid Client for future integration with API
    // Conditional statement used for testing without actually calling Sendgrid. Remove when perform actual integration
    if (process.env.NODE_ENV != 'test') {
      const sendgrid = new SendGridService();
      sendgrid.setApiKey(sendGridApiKey);
      try {
        const data: MailDataRequired = {
          to: request.recipients,
          cc: request.cc,
          bcc: request.bcc,
          replyToList: request.replyToList,
          from: {
            email: request.sender.email,
            name: request.sender.name,
          },
          subject: request.subject,
          content: [request.content[0], ...request.content.splice(1)],
        };
        await sendgrid.send(data);
      } catch (err) {
        throw new RpcException({
          code: status.INVALID_ARGUMENT,
          message: JSON.stringify(err),
        });
      }
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
    const config = await lastValueFrom(
      this.emailService.getEmailServiceConfig({
        id: req.configId,
        environment: req.configEnvironment,
      }),
    );

    const sendgridApiKey = config.sendgridKey;

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
          nickname: req.nickname ?? req.fromName,
          from_email: req.fromEmail,
          from_name: req.fromName,
          reply_to: req.replyTo,
          address: req.address,
          city: req.city,
          state: req.state,
          zip: req.zip,
          country: req.country,
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
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: JSON.stringify(err),
      });
    }
  }

  async verifyDomain(
    req: EmailProto.VerifyDomainRequest,
  ): Promise<EmailProto.VerifyDomainResponse> {
    const domain = await lastValueFrom(
      this.emailService.getEmailDomain({
        domain: req.domain,
      }),
    );

    const id = domain.sendgridId;

    const config = await lastValueFrom(
      this.emailService.getEmailServiceConfig({
        id: req.configId,
        environment: req.configEnvironment,
      }),
    );

    const sendgridApiKey = config.sendgridKey;
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
