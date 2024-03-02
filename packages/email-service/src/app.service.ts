import { Injectable } from '@nestjs/common';
import { EmailProto } from 'juno-proto';
import axios from 'axios';
import { RpcException } from '@nestjs/microservices';

@Injectable()
export class AppService {
  async registerSender(
    req: EmailProto.RegisterSenderRequest,
  ): Promise<EmailProto.RegisterEmailResponse> {
    if (!req.from_email) {
      throw new RpcException('Cannot register sender (no email supplied)');
    }
    if (!req.from_name) {
      throw new RpcException('Cannot register sender (no name supplied)');
    }
    if (!req.reply_to) {
      throw new RpcException('Cannot register sender (no reply to specified)');
    }

    const sendgridApiKey = process.env.SENDGRID_API_KEY;

    if (!sendgridApiKey) {
      throw new RpcException(
        'Cannot register sender (sendgrid API key is missing)',
      );
    }
    const sendgridUrl = 'https://api.sendgrid.com/v3/verified_senders';

    try {
      const res = await axios.post(
        sendgridUrl,
        {
          from_email: req.from_email,
          from_name: req.from_name,
          reply_to: req.reply_to,
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
