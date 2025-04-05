import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { EmailProto } from 'juno-proto';
import { SendGridService } from 'src/sendgrid.service';
import type { ClientRequest } from '@sendgrid/client/src/request';
import type { ClientResponse } from '@sendgrid/client/src/response';
import * as sendgridClient from '@sendgrid/client';
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
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: 'Cannot register domain (no domain supplied)',
      });
    }

    const config = await lastValueFrom(
      this.emailService.getEmailServiceConfig({
        id: Number(req.configId),
        environment: req.configEnvironment,
      }),
    );

    const sendGridApiKey = config.sendgridKey;

    if (!sendGridApiKey) {
      throw new RpcException({
        code: status.FAILED_PRECONDITION,
        message: 'Cannot register domain (SendGrid API key not in .env)',
      });
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
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: 'Cannot register sender (no email supplied)',
      });
    }
    if (!req.fromName) {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: 'Cannot register sender (no name supplied)',
      });
    }
    if (!req.replyTo) {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: 'Cannot register sender (no reply to specified)',
      });
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
      throw new RpcException({
        code: status.FAILED_PRECONDITION,
        message: 'Cannot register sender (sendgrid API key is missing)',
      });
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
      throw new RpcException({
        code: status.FAILED_PRECONDITION,
        message: 'Cannot verify domain (sendgrid API key is missing)',
      });
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
      throw new RpcException({
        code: status.FAILED_PRECONDITION,
        message: 'Failed to register domain',
      });
    }
  }
  async getStatistics(
    req: EmailProto.GetStatisticsRequest,
  ): Promise<EmailProto.StatisticResponses> {
    const config = await lastValueFrom(
      this.emailService.getEmailServiceConfig({
        id: req.configId,
        environment: req.configEnvironment,
      }),
    );
    const sendGridApiKey = config.sendgridKey;
    sendgridClient.setApiKey(sendGridApiKey);
    const reverseIntervalMap: Record<EmailProto.AggregateInterval, string> = {
      [EmailProto.AggregateInterval.DAY]: 'day',
      [EmailProto.AggregateInterval.WEEK]: 'week',
      [EmailProto.AggregateInterval.MONTH]: 'month',
      [EmailProto.AggregateInterval.UNRECOGNIZED]: 'unrecognized',
    };
    const queryParams = {
      limit: req.limit,
      offset: req.offset,
      start_date: req.startDate,
      aggregated_by: reverseIntervalMap[req.aggregatedBy],
      end_date: req.endDate,
    };
    console.log('QueryParams', queryParams);
    const request: ClientRequest = {
      url: `/v3/stats`,
      method: 'GET',
      qs: queryParams,
    };
    try {
      const intermediate = await sendgridClient.request(request);
      const response: ClientResponse = intermediate[0];
      const data: Statistics[] = response.body as Statistics[];

      return {
        responses: data.map((statistic) => {
          //Sendgrid response is in a weird format
          const metrics = statistic.stats[0].metrics;
          return {
            date: statistic.date,
            clicks: metrics.clicks,
            uniqueClicks: metrics.unique_clicks,
            opens: metrics.opens,
            uniqueOpens: metrics.unique_opens,
            blocks: metrics.blocks,
            bounceDrops: metrics.bounce_drops,
            bounces: metrics.bounces,
            deferred: metrics.deferred,
            delivered: metrics.delivered,
            invalidEmails: metrics.invalid_emails,
            processed: metrics.processed,
            requests: metrics.requests,
            spamReportDrops: metrics.spam_report_drops,
            spamReports: metrics.spam_reports,
            unsubscribeDrops: metrics.unsubscribe_drops,
            unsubscribes: metrics.unsubscribes,
          };
        }),
      };
    } catch (err) {
      try {
        throw new RpcException({
          code: status.INVALID_ARGUMENT,
          message: JSON.stringify(err['body']['errors']),
        });
      } catch {
        throw new RpcException({
          code: status.INVALID_ARGUMENT,
          message: JSON.stringify(err.response?.body?.errors),
        });
      }
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

// Email Metrics Interface
interface EmailMetrics {
  blocks: number;
  bounce_drops: number;
  bounces: number;
  clicks: number;
  deferred: number;
  delivered: number;
  invalid_emails: number;
  opens: number;
  processed: number;
  requests: number;
  spam_report_drops: number;
  spam_reports: number;
  unique_clicks: number;
  unique_opens: number;
  unsubscribe_drops: number;
  unsubscribes: number;
}

// Stats Interface containing metrics
interface Stats {
  metrics: EmailMetrics;
}

// Statistics containing a date and an array of stats
interface Statistics {
  date: string;
  stats: Stats[];
}
