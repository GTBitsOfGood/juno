import { Test, TestingModule } from '@nestjs/testing';
import { INestMicroservice } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import * as ProtoLoader from '@grpc/proto-loader';
import * as GRPC from '@grpc/grpc-js';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ResetProtoFile, EmailProto, EmailProtoFile } from 'juno-proto';
import { status } from '@grpc/grpc-js';

const { JUNO_EMAIL_PACKAGE_NAME } = EmailProto;

let app: INestMicroservice;

jest.setTimeout(10000);

async function initApp() {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: [JUNO_EMAIL_PACKAGE_NAME],
      protoPath: [EmailProtoFile],
      url: process.env.EMAIL_SERVICE_ADDR,
    },
  });

  await app.init();

  await app.listen();
  return app;
}

beforeAll(async () => {
  app = await initApp();

  const proto = ProtoLoader.loadSync([ResetProtoFile]) as any;

  const protoGRPC = GRPC.loadPackageDefinition(proto) as any;

  const resetClient = new protoGRPC.juno.reset_db.DatabaseReset(
    process.env.DB_SERVICE_ADDR,
    GRPC.credentials.createInsecure(),
  );

  await new Promise((resolve) => {
    resetClient.resetDb({}, () => {
      resolve(0);
    });
  });
});

afterAll((done) => {
  app.close();
  done();
});

describe('Email Service Send Email Tests', () => {
  let emailClient: any;
  beforeEach(async () => {
    const proto = ProtoLoader.loadSync([EmailProtoFile]) as any;

    const protoGRPC = GRPC.loadPackageDefinition(proto) as any;

    emailClient = new protoGRPC.juno.email.EmailService(
      process.env.EMAIL_SERVICE_ADDR,
      GRPC.credentials.createInsecure(),
    );
  });

  it('Send email with valid sender, recipients, and content', async () => {
    await new Promise((resolve) => {
      emailClient.sendEmail(
        {
          sender: { email: 'testSender@gmail.com' },
          recipients: [{ email: 'testRecipient@gmail.com' }],
          content: [{ type: 'text/plain', value: 'Test email' }],
        },
        (err, resp) => {
          expect(err).toBeNull();
          expect(resp.statusCode).toBe(200);
          resolve(resp);
        },
      );
    });
  });

  it('Send email with null sender', async () => {
    await new Promise((resolve) => {
      emailClient.sendEmail(
        {
          sender: null,
          recipients: [{ email: 'testRecipient@gmail.com' }],
          content: [{ type: 'text/plain', value: 'Test email' }],
        },
        (err, resp) => {
          expect(err).toBeDefined();
          expect(err.code).toBe(status.INVALID_ARGUMENT);
          resolve(resp);
        },
      );
    });
  });

  it('Send email with null sender email', async () => {
    await new Promise((resolve) => {
      emailClient.sendEmail(
        {
          sender: { email: null },
          recipients: [{ email: 'testRecipient@gmail.com' }],
          content: [{ type: 'text/plain', value: 'Test email' }],
        },
        (err, resp) => {
          expect(err).toBeDefined();
          expect(err.code).toBe(status.INVALID_ARGUMENT);
          resolve(resp);
        },
      );
    });
  });

  it('Send email with empty sender email', async () => {
    await new Promise((resolve) => {
      emailClient.sendEmail(
        {
          sender: { email: '' },
          recipients: [{ email: 'testRecipient@gmail.com' }],
          content: [{ type: 'text/plain', value: 'Test email' }],
        },
        (err, resp) => {
          expect(err).toBeDefined();
          expect(err.code).toBe(status.INVALID_ARGUMENT);
          resolve(resp);
        },
      );
    });
  });

  it('Send email with null recipients', async () => {
    await new Promise((resolve) => {
      emailClient.sendEmail(
        {
          sender: { email: 'testSender@gmail.com' },
          recipients: null,
          content: [{ type: 'text/plain', value: 'Test email' }],
        },
        (err, resp) => {
          expect(err).toBeDefined();
          expect(err.code).toBe(status.INVALID_ARGUMENT);
          resolve(resp);
        },
      );
    });
  });

  it('Send email with empty recipients list', async () => {
    await new Promise((resolve) => {
      emailClient.sendEmail(
        {
          sender: { email: 'testSender@gmail.com' },
          recipients: [],
          content: [{ type: 'text/plain', value: 'Test email' }],
        },
        (err, resp) => {
          expect(err).toBeDefined();
          expect(err.code).toBe(status.INVALID_ARGUMENT);
          resolve(resp);
        },
      );
    });
  });

  it('Send email with null recipients email', async () => {
    await new Promise((resolve) => {
      emailClient.sendEmail(
        {
          sender: { email: 'testSender@gmail.com' },
          recipients: [{ email: null }],
          content: [{ type: 'text/plain', value: 'Test email' }],
        },
        (err, resp) => {
          expect(err).toBeDefined();
          expect(err.code).toBe(status.INVALID_ARGUMENT);
          resolve(resp);
        },
      );
    });
  });

  it('Send email with empty recipients email', async () => {
    await new Promise((resolve) => {
      emailClient.sendEmail(
        {
          sender: { email: 'testSender@gmail.com' },
          recipients: [{ email: '' }],
          content: [{ type: 'text/plain', value: 'Test email' }],
        },
        (err, resp) => {
          expect(err).toBeDefined();
          expect(err.code).toBe(status.INVALID_ARGUMENT);
          resolve(resp);
        },
      );
    });
  });

  it('Send email with null content list', async () => {
    await new Promise((resolve) => {
      emailClient.sendEmail(
        {
          sender: { email: 'testSender@gmail.com' },
          recipients: [{ email: 'testRecipient@gmail.com' }],
          content: null,
        },
        (err, resp) => {
          expect(err).toBeDefined();
          expect(err.code).toBe(status.INVALID_ARGUMENT);
          resolve(resp);
        },
      );
    });
  });

  it('Send email with empty content list', async () => {
    await new Promise((resolve) => {
      emailClient.sendEmail(
        {
          sender: { email: 'testSender@gmail.com' },
          recipients: [{ email: 'testRecipient@gmail.com' }],
          content: [],
        },
        (err, resp) => {
          expect(err).toBeDefined();
          expect(err.code).toBe(status.INVALID_ARGUMENT);
          resolve(resp);
        },
      );
    });
  });

  it('Send email with null content type', async () => {
    await new Promise((resolve) => {
      emailClient.sendEmail(
        {
          sender: { email: 'testSender@gmail.com' },
          recipients: [{ email: 'testRecipient@gmail.com' }],
          content: [{ type: null, value: 'Test email' }],
        },
        (err, resp) => {
          expect(err).toBeDefined();
          expect(err.code).toBe(status.INVALID_ARGUMENT);
          resolve(resp);
        },
      );
    });
  });

  it('Send email with null content value', async () => {
    await new Promise((resolve) => {
      emailClient.sendEmail(
        {
          sender: { email: 'testSender@gmail.com' },
          recipients: [{ email: 'testRecipient@gmail.com' }],
          content: [{ type: 'text/plain', value: null }],
        },
        (err, resp) => {
          expect(err).toBeDefined();
          expect(err.code).toBe(status.INVALID_ARGUMENT);
          resolve(resp);
        },
      );
    });
  });

  it('Send email with empty content type', async () => {
    await new Promise((resolve) => {
      emailClient.sendEmail(
        {
          sender: { email: 'testSender@gmail.com' },
          recipients: [{ email: 'testRecipient@gmail.com' }],
          content: [{ type: '', value: 'Test email' }],
        },
        (err, resp) => {
          expect(err).toBeDefined();
          expect(err.code).toBe(status.INVALID_ARGUMENT);
          resolve(resp);
        },
      );
    });
  });

  it('Send email with empty content value', async () => {
    await new Promise((resolve) => {
      emailClient.sendEmail(
        {
          sender: { email: 'testSender@gmail.com' },
          recipients: [{ email: 'testRecipient@gmail.com' }],
          content: [{ type: 'text/plain', value: '' }],
        },
        (err, resp) => {
          expect(err).toBeDefined();
          expect(err.code).toBe(status.INVALID_ARGUMENT);
          resolve(resp);
        },
      );
    });
  });
});
