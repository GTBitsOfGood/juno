import axios, { AxiosError } from 'axios';
import { ClientGrpc, RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { of, throwError } from 'rxjs';
import { EmailService } from '../src/modules/email/email.service';

// These tests exercise the real (non-test-mode) SendGrid code paths in
// EmailService. SendGrid (axios) and db-service are mocked, so no services need
// to be running. NODE_ENV is switched away from 'test' for each test, because
// in test mode the service returns in-memory data and never calls SendGrid.

const originalNodeEnv = process.env['NODE_ENV'];

beforeEach(() => {
  process.env['NODE_ENV'] = 'production';
});

afterEach(() => {
  process.env['NODE_ENV'] = originalNodeEnv;
  jest.restoreAllMocks();
});

const SENDGRID_KEY = 'project-key';

function configFor(id: number) {
  return {
    id,
    environment: 'prod',
    sendgridKey: SENDGRID_KEY,
    domains: [],
    senders: [],
  };
}

function buildService(db: Record<string, jest.Mock>): EmailService {
  const grpc = { getService: () => db } as unknown as ClientGrpc;
  const service = new EmailService(grpc);
  service.onModuleInit();
  return service;
}

// Resolves with the RpcException thrown by the promise. The final throw is
// outside the try/catch, so the test fails if the call unexpectedly succeeds.
async function rpcError(promise: Promise<unknown>): Promise<RpcException> {
  try {
    await promise;
  } catch (e) {
    return e as RpcException;
  }
  throw new Error('Expected the call to reject');
}

function sendgridError(httpStatus: number, message: string): AxiosError {
  return new AxiosError(
    'Request failed',
    'ERR_BAD_REQUEST',
    { headers: { Authorization: `Bearer ${SENDGRID_KEY}` } } as any,
    undefined,
    {
      status: httpStatus,
      data: { errors: [{ message }] },
    } as any,
  );
}

const SENDGRID_SENDERS = {
  results: [1, 2, 3].map((id) => ({
    id,
    nickname: `nick${id}`,
    from_email: `sender${id}@example.com`,
    from_name: `Sender ${id}`,
    reply_to: `sender${id}@example.com`,
    address: '1 Test St',
    city: 'Atlanta',
    state: 'GA',
    country: 'US',
    zip: '30301',
    verified: id === 2,
    locked: false,
  })),
};

const SENDGRID_DOMAINS = [10, 11, 12].map((id) => ({
  id,
  domain: `domain${id}.com`,
  subdomain: 'mail',
  valid: id === 11,
}));

describe('getSenders (real SendGrid path)', () => {
  it('returns only the senders recorded for the project', async () => {
    const get = jest
      .spyOn(axios, 'get')
      .mockResolvedValue({ data: SENDGRID_SENDERS });
    const service = buildService({
      getEmailServiceConfig: jest.fn(() => of(configFor(0))),
      getConfigResources: jest.fn(() =>
        of({ domainSendgridIds: [], senderSendgridIds: [2] }),
      ),
    });

    const res = await service.getSenders({
      configId: 0,
      configEnvironment: 'prod',
    });

    expect(res.senders.map((s) => Number(s.id))).toEqual([2]);
    expect(res.senders[0]).toMatchObject({
      fromEmail: 'sender2@example.com',
      verified: true,
    });
    expect(get).toHaveBeenCalledWith(
      'https://api.sendgrid.com/v3/verified_senders',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: `Bearer ${SENDGRID_KEY}`,
        }),
      }),
    );
  });

  it('keeps two projects on one SendGrid account apart', async () => {
    jest.spyOn(axios, 'get').mockResolvedValue({ data: SENDGRID_SENDERS });
    const service = buildService({
      getEmailServiceConfig: jest.fn((req: { id: number }) =>
        of(configFor(req.id)),
      ),
      getConfigResources: jest.fn((req: { id: number }) =>
        of({
          domainSendgridIds: [],
          senderSendgridIds: req.id === 1 ? [1] : [3],
        }),
      ),
    });

    const a = await service.getSenders({
      configId: 1,
      configEnvironment: 'prod',
    });
    const b = await service.getSenders({
      configId: 2,
      configEnvironment: 'prod',
    });

    expect(a.senders.map((s) => Number(s.id))).toEqual([1]);
    expect(b.senders.map((s) => Number(s.id))).toEqual([3]);
  });

  it('returns nothing when no senders are recorded for the project', async () => {
    jest.spyOn(axios, 'get').mockResolvedValue({ data: SENDGRID_SENDERS });
    const service = buildService({
      getEmailServiceConfig: jest.fn(() => of(configFor(0))),
      getConfigResources: jest.fn(() =>
        of({ domainSendgridIds: [], senderSendgridIds: [] }),
      ),
    });

    const res = await service.getSenders({
      configId: 0,
      configEnvironment: 'prod',
    });

    expect(res.senders).toEqual([]);
  });
});

describe('getDomains (real SendGrid path)', () => {
  it('returns only the domains recorded for the project', async () => {
    const get = jest
      .spyOn(axios, 'get')
      .mockResolvedValue({ data: SENDGRID_DOMAINS });
    const service = buildService({
      getEmailServiceConfig: jest.fn(() => of(configFor(0))),
      getConfigResources: jest.fn(() =>
        of({ domainSendgridIds: [11], senderSendgridIds: [] }),
      ),
    });

    const res = await service.getDomains({
      configId: 0,
      configEnvironment: 'prod',
    });

    expect(res.domains.map((d) => Number(d.id))).toEqual([11]);
    expect(res.domains[0]).toMatchObject({
      domain: 'domain11.com',
      subdomain: 'mail',
      valid: true,
    });
    expect(get).toHaveBeenCalledWith(
      'https://api.sendgrid.com/v3/whitelabel/domains',
      expect.anything(),
    );
  });

  it('keeps two projects on one SendGrid account apart', async () => {
    jest.spyOn(axios, 'get').mockResolvedValue({ data: SENDGRID_DOMAINS });
    const service = buildService({
      getEmailServiceConfig: jest.fn((req: { id: number }) =>
        of(configFor(req.id)),
      ),
      getConfigResources: jest.fn((req: { id: number }) =>
        of({
          domainSendgridIds: req.id === 1 ? [10] : [12],
          senderSendgridIds: [],
        }),
      ),
    });

    const a = await service.getDomains({
      configId: 1,
      configEnvironment: 'prod',
    });
    const b = await service.getDomains({
      configId: 2,
      configEnvironment: 'prod',
    });

    expect(a.domains.map((d) => Number(d.id))).toEqual([10]);
    expect(b.domains.map((d) => Number(d.id))).toEqual([12]);
  });
});

describe('SendGrid error mapping', () => {
  function serviceWithResources() {
    return buildService({
      getEmailServiceConfig: jest.fn(() => of(configFor(0))),
      getConfigResources: jest.fn(() =>
        of({ domainSendgridIds: [], senderSendgridIds: [] }),
      ),
    });
  }

  it('maps a SendGrid 401 to FAILED_PRECONDITION without leaking the key', async () => {
    jest
      .spyOn(axios, 'get')
      .mockRejectedValue(
        sendgridError(401, 'The provided authorization grant is invalid'),
      );

    const err = await rpcError(
      serviceWithResources().getSenders({
        configId: 0,
        configEnvironment: 'prod',
      }),
    );

    const info = err.getError() as { code: number; message: string };
    expect(info.code).toBe(status.FAILED_PRECONDITION);
    expect(info.message).toContain(
      'The provided authorization grant is invalid',
    );
    expect(info.message).not.toContain(SENDGRID_KEY);
  });

  it('maps a SendGrid 403 to FAILED_PRECONDITION', async () => {
    jest
      .spyOn(axios, 'get')
      .mockRejectedValue(sendgridError(403, 'access forbidden'));

    const err = await rpcError(
      serviceWithResources().getDomains({
        configId: 0,
        configEnvironment: 'prod',
      }),
    );

    expect(err.getError()).toMatchObject({ code: status.FAILED_PRECONDITION });
  });

  it('maps a SendGrid 429 to RESOURCE_EXHAUSTED', async () => {
    jest
      .spyOn(axios, 'get')
      .mockRejectedValue(sendgridError(429, 'too many requests'));

    const err = await rpcError(
      serviceWithResources().getSenders({
        configId: 0,
        configEnvironment: 'prod',
      }),
    );

    expect(err.getError()).toMatchObject({ code: status.RESOURCE_EXHAUSTED });
  });

  it('maps other SendGrid failures to INTERNAL', async () => {
    jest
      .spyOn(axios, 'get')
      .mockRejectedValue(sendgridError(500, 'sendgrid is down'));

    const err = await rpcError(
      serviceWithResources().getSenders({
        configId: 0,
        configEnvironment: 'prod',
      }),
    );

    expect(err.getError()).toMatchObject({ code: status.INTERNAL });
  });

  it('maps a network failure (no response) to INTERNAL', async () => {
    jest.spyOn(axios, 'get').mockRejectedValue(new Error('socket hang up'));

    const err = await rpcError(
      serviceWithResources().getDomains({
        configId: 0,
        configEnvironment: 'prod',
      }),
    );

    expect(err.getError()).toMatchObject({ code: status.INTERNAL });
  });
});

describe('registerSender (real SendGrid path)', () => {
  const request = {
    fromEmail: 'new-sender@example.com',
    fromName: 'New Sender',
    replyTo: 'new-sender@example.com',
    configId: 3,
    configEnvironment: 'prod',
    nickname: 'New Sender',
    address: '1 Test St',
    city: 'Atlanta',
    state: 'GA',
    country: 'US',
    zip: '30301',
  };

  it('records the SendGrid sender id for the project', async () => {
    jest
      .spyOn(axios, 'post')
      .mockResolvedValue({ status: 201, data: { id: 77 } });
    const createVerifiedSender = jest.fn(() => of({}));
    const service = buildService({
      getEmailServiceConfig: jest.fn(() => of(configFor(3))),
      createVerifiedSender,
    });

    const res = await service.registerSender(request);

    expect(res.statusCode).toBe(201);
    expect(createVerifiedSender).toHaveBeenCalledWith({
      configId: 3,
      configEnvironment: 'prod',
      sendgridId: 77,
      fromEmail: 'new-sender@example.com',
    });
  });

  it('records nothing when SendGrid rejects the sender', async () => {
    jest
      .spyOn(axios, 'post')
      .mockRejectedValue(sendgridError(400, 'address is invalid'));
    const createVerifiedSender = jest.fn(() => of({}));
    const service = buildService({
      getEmailServiceConfig: jest.fn(() => of(configFor(3))),
      createVerifiedSender,
    });

    const err = await rpcError(service.registerSender(request));

    expect(err.getError()).toMatchObject({ code: status.INVALID_ARGUMENT });
    expect(createVerifiedSender).not.toHaveBeenCalled();
  });
});

describe('verifyDomain (real SendGrid path)', () => {
  it("looks the domain up for the caller's project and sends the auth header", async () => {
    const post = jest.spyOn(axios, 'post').mockResolvedValue({
      status: 200,
      data: {
        valid: true,
        validation_results: {
          mail_cname: { valid: true, type: 'cname', host: 'mail', data: 'x' },
        },
      },
    });
    const getEmailDomain = jest.fn(() =>
      of({ domain: 'example.com', sendgridId: 42, projects: [] }),
    );
    const service = buildService({
      getEmailDomain,
      getEmailServiceConfig: jest.fn(() => of(configFor(3))),
    });

    const res = await service.verifyDomain({
      domain: 'example.com',
      configId: 3,
      configEnvironment: 'prod',
    });

    expect(getEmailDomain).toHaveBeenCalledWith({
      domain: 'example.com',
      configId: 3,
      configEnvironment: 'prod',
    });
    expect(res).toMatchObject({ id: 42, valid: true, statusCode: 200 });
    // The SendGrid id comes from the project's own link, and the auth header is
    // sent as request config (not in the request body).
    expect(post).toHaveBeenCalledWith(
      'https://api.sendgrid.com/v3/whitelabel/domains/42/validate',
      {},
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: `Bearer ${SENDGRID_KEY}`,
        }),
      }),
    );
  });

  it('does not call SendGrid for a domain the project has not registered', async () => {
    const post = jest.spyOn(axios, 'post');
    const service = buildService({
      getEmailDomain: jest.fn(() =>
        throwError(() => ({
          code: status.NOT_FOUND,
          message: 'Domain not found',
        })),
      ),
      getEmailServiceConfig: jest.fn(() => of(configFor(3))),
    });

    await expect(
      service.verifyDomain({
        domain: 'someone-elses.example.com',
        configId: 3,
        configEnvironment: 'prod',
      }),
    ).rejects.toMatchObject({ code: status.NOT_FOUND });
    expect(post).not.toHaveBeenCalled();
  });
});
