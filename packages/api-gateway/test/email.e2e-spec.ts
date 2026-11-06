import { Test, TestingModule } from '@nestjs/testing';
import {
  ClassSerializerInterceptor,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { AppModule } from './../src/app.module';
import { Reflector } from '@nestjs/core';
import * as request from 'supertest';
import { ResetProtoFile } from 'juno-proto';
import * as GRPC from '@grpc/grpc-js';
import * as ProtoLoader from '@grpc/proto-loader';
import { RpcExceptionFilter } from 'src/rpc_exception_filter';

let app: INestApplication;
const ADMIN_EMAIL = 'test-superadmin@test.com';
const ADMIN_PASSWORD = 'test-password';

let apiKey: string;
jest.setTimeout(15000);

beforeAll(async () => {
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

async function createApiKey(proj: string, env: string): Promise<string> {
  const key = await request(app.getHttpServer())
    .post('/auth/key')
    .set('X-User-Email', ADMIN_EMAIL)
    .set('X-User-Password', ADMIN_PASSWORD)
    .send({
      environment: env,
      project: {
        name: proj,
      },
    });

  return key.body['apiKey'];
}

async function createProject(name: string): Promise<number> {
  const res = await request(app.getHttpServer())
    .post('/project')
    .set('X-User-Email', ADMIN_EMAIL)
    .set('X-User-Password', ADMIN_PASSWORD)
    .send({ name })
    .expect(201);

  return res.body['id'];
}

async function createUser(email: string, password: string): Promise<number> {
  const res = await request(app.getHttpServer())
    .post('/user')
    .set('X-User-Email', ADMIN_EMAIL)
    .set('X-User-Password', ADMIN_PASSWORD)
    .send({ name: 'Email Scope Test User', email, password })
    .expect(201);

  return res.body['id'];
}

async function JWTforUser(email: string, password: string): Promise<string> {
  const res = await request(app.getHttpServer())
    .post('/auth/user/jwt')
    .set('X-User-Email', email)
    .set('X-User-Password', password)
    .send();

  return res.body['token'];
}

interface ScopingFixtures {
  projectAId: number;
  projectBId: number;
  apiKeyA: string;
  apiKeyB: string;
  scopedAdminJwt: string; // ADMIN linked to project A only
  unlinkedUserJwt: string; // regular user linked to no project
}

let scopingFixtures: ScopingFixtures | undefined;

// Two projects, each with its own API key and its own SendGrid key, plus two
// users: an admin linked to project A only, and a user linked to nothing.
// Created lazily (and once) so the tests don't depend on hook ordering.
async function getScopingFixtures(): Promise<ScopingFixtures> {
  if (scopingFixtures) {
    return scopingFixtures;
  }

  const projectAId = await createProject('email-scope-a');
  const projectBId = await createProject('email-scope-b');
  const apiKeyA = await createApiKey('email-scope-a', 'prod');
  const apiKeyB = await createApiKey('email-scope-b', 'prod');

  await request(app.getHttpServer())
    .post('/email/setup')
    .set('Authorization', 'Bearer ' + apiKeyA)
    .send({ sendgridKey: 'scoping-key-a' })
    .expect(201);
  await request(app.getHttpServer())
    .post('/email/setup')
    .set('Authorization', 'Bearer ' + apiKeyB)
    .send({ sendgridKey: 'scoping-key-b' })
    .expect(201);

  const adminEmail = 'email-scope-admin@example.com';
  const adminId = await createUser(adminEmail, 'password');
  await request(app.getHttpServer())
    .post('/user/type')
    .set('X-User-Email', ADMIN_EMAIL)
    .set('X-User-Password', ADMIN_PASSWORD)
    .send({ email: adminEmail, type: 'ADMIN' })
    .expect(201);
  await request(app.getHttpServer())
    .put(`/user/id/${adminId}/project`)
    .set('X-User-Email', ADMIN_EMAIL)
    .set('X-User-Password', ADMIN_PASSWORD)
    .send({ name: 'email-scope-a' })
    .expect(200);

  const unlinkedEmail = 'email-scope-unlinked@example.com';
  await createUser(unlinkedEmail, 'password');

  // JWTs are issued after the user is set up, so they reflect the linkage.
  scopingFixtures = {
    projectAId,
    projectBId,
    apiKeyA,
    apiKeyB,
    scopedAdminJwt: await JWTforUser(adminEmail, 'password'),
    unlinkedUserJwt: await JWTforUser(unlinkedEmail, 'password'),
  };
  return scopingFixtures;
}

beforeEach(async () => {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  app = moduleFixture.createNestApplication();
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
    }),
  );
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
  app.useGlobalFilters(new RpcExceptionFilter());

  await app.init();

  if (!apiKey) {
    apiKey = await createApiKey('test-seed-project', 'prod');
  }
});

describe('Email Service Config Routes', () => {
  it('Successfully get an email config ', async () => {
    await request(app.getHttpServer())
      .get('/email/config/0')
      .set('Authorization', 'Bearer ' + apiKey)
      .expect(200);
  });

  it('Failed to get email config due to invalid id', async () => {
    return await request(app.getHttpServer())
      .get('/email/config/invalid-id')
      .set('Authorization', 'Bearer ' + apiKey)
      .expect(400);
  });

  it('Failed to get email config due to missing api key', async () => {
    return await request(app.getHttpServer())
      .get('/email/config/0')
      .expect(401);
  });

  it('Failed to get email config due to not found id', async () => {
    return await request(app.getHttpServer())
      .get('/email/config/1')
      .set('Authorization', 'Bearer ' + apiKey)
      .expect(404);
  });
});

describe('Email Service Setup Routes', () => {
  it('Creates a new service for a different env', async () => {
    const apiKey = await createApiKey('test-seed-project', 'dev');
    await request(app.getHttpServer())
      .post('/email/setup')
      .set('Authorization', 'Bearer ' + apiKey)
      .send({
        sendgridKey: 'test-key-dev-env',
      })
      .expect(201);

    // make sure this worked by registering a domain
    return request(app.getHttpServer())
      .post('/email/register-domain')
      .set('Authorization', 'Bearer ' + apiKey)
      .send({
        domain: 'example.com',
        subdomain: 'sub',
      })
      .expect(201);
  });

  it('Replaces original sendgrid key when attempting to set up a service that already exists', async () => {
    const apiKey = await createApiKey('test-seed-project', 'dev');
    await request(app.getHttpServer())
      .post('/email/setup')
      .set('Authorization', 'Bearer ' + apiKey)
      .send({
        sendgridKey: 'test-key1',
      });

    await request(app.getHttpServer())
      .post('/email/setup')
      .set('Authorization', 'Bearer ' + apiKey)
      .send({
        sendgridKey: 'test-key2',
      })
      .expect(201);

    await request(app.getHttpServer())
      .get('/email/config/0')
      .set('Authorization', 'Bearer ' + apiKey)
      .then((response) => {
        expect(response.body.sendgridKey).toEqual('test-key2');
      });
  });

  it('Fails without a sendgridKey', async () => {
    const apiKey = await createApiKey('test-seed-project', 'dev2');
    return request(app.getHttpServer())
      .post('/email/setup')
      .set('Authorization', 'Bearer ' + apiKey)
      .send({})
      .expect(400);
  });

  it('Fails when called without an API Key', () => {
    return request(app.getHttpServer())
      .post('/email/setup')
      .send({
        sendgridKey: 'test-key',
      })
      .expect(401);
  });
  it('Fails when called with an invalid API Key', () => {
    return request(app.getHttpServer())
      .post('/email/setup')
      .set('Authorization', 'Bearer invalid.api.key')
      .send({
        sendgridKey: 'test-key',
      })
      .expect(401);
  });
});

describe('Email Registration Routes', () => {
  it('Registers an email without a body', () => {
    return request(app.getHttpServer())
      .post('/email/register-sender')
      .set('Authorization', 'Bearer ' + apiKey)
      .expect(400);
  });
  it('Has been called with a malformed emaiil', () => {
    return request(app.getHttpServer())
      .post('/email/register-sender')
      .set('Authorization', 'Bearer ' + apiKey)
      .send({
        email: 'invalidemail', // Malformed email
        name: 'name',
        address: 'address',
        city: 'city',
        state: 'state',
        country: 'country',
        zip: 'zip',
      })
      .expect(400);
  });
  it('Registration endpoint called with no Authorization header', () => {
    return request(app.getHttpServer())
      .post('/email/register-sender')
      .send({
        email: 'validemail@example.com',
        name: 'name',
        address: 'address',
        city: 'city',
        state: 'state',
        country: 'country',
        zip: 'zip',
      })
      .expect(401);
  });
  it('Registration endpoint called with an invalid API Key', () => {
    return request(app.getHttpServer())
      .post('/email/register-sender')
      .set('Authorization', 'Bearer invalid.api.key')
      .send({
        email: 'validemail@example.com',
        name: 'name',
        address: 'address',
        city: 'city',
        state: 'state',
        country: 'country',
        zip: 'zip',
      })
      .expect(401);
  });
  it('Registration endpoint called with a correct payload (header + body)', () => {
    // Assuming 'valid.api.key' is a placeholder for a valid API Key obtained in a way relevant to your test setup
    return request(app.getHttpServer())
      .post('/email/register-sender')
      .set('Authorization', 'Bearer ' + apiKey)
      .send({
        email: 'validemail@example.com',
        name: 'name',
        address: 'address',
        city: 'city',
        state: 'state',
        country: 'country',
        zip: 'zip',
      })
      .expect(201); // Assuming the server responds with 201 Created on successful registration
  });
});

describe('Email Sending Route', () => {
  it('should return 401 when Authorization header is missing', async () => {
    return request(app.getHttpServer())
      .post('/email/send')
      .send({
        sender: { email: 'testSender@gmail.com' },
        recipients: [{ email: 'testRecipient@gmail.com' }],
        content: [{ type: 'text/plain', value: 'Test email' }],
        subject: 'Test email',
      })
      .expect(401);
  });

  it('should return 401 when API Key is invalid', async () => {
    return request(app.getHttpServer())
      .post('/email/send')
      .set('Authorization', 'Bearer invalid_key')
      .send({
        sender: { email: 'testSender@gmail.com' },
        recipients: [{ email: 'testRecipient@gmail.com' }],
        content: [{ type: 'text/plain', value: 'Test email' }],
        subject: 'Test email',
      })
      .expect(401);
  });

  it('Send email with valid parameters and API Key is valid', async () => {
    return request(app.getHttpServer())
      .post('/email/send')
      .set('Authorization', 'Bearer ' + apiKey)
      .send({
        sender: { email: 'testSender@gmail.com' },
        recipients: [{ email: 'testRecipient@gmail.com' }],
        subject: 'Test email',
        content: [{ type: 'text/plain', value: 'Test email' }],
      })
      .expect(201);
  });

  it('Send email with valid parameters (with names) and API Key is valid', async () => {
    return request(app.getHttpServer())
      .post('/email/send')
      .set('Authorization', 'Bearer ' + apiKey)
      .send({
        sender: { email: 'testSender@gmail.com', name: 'SenderName' },
        recipients: [
          { email: 'testRecipient@gmail.com', name: 'RecipientName' },
        ],
        subject: 'Test email',
        content: [{ type: 'text/plain', value: 'Test email' }],
      })
      .expect(201);
  });

  it('Send email with valid parameters (with names, multiple recipients) and API Key is valid', async () => {
    return request(app.getHttpServer())
      .post('/email/send')
      .set('Authorization', 'Bearer ' + apiKey)
      .send({
        sender: { email: 'testSender@gmail.com', name: 'SenderName' },
        recipients: [
          { email: 'testRecipient1@gmail.com', name: 'RecipientName1' },
          { email: 'testRecipient2@gmail.com', name: 'RecipientName2' },
        ],
        subject: 'Test email',
        content: [{ type: 'text/plain', value: 'Test email' }],
      })
      .expect(201);
  });

  it('Send email with valid parameters (with names, multiple recipients and contents) and API Key is valid', async () => {
    return request(app.getHttpServer())
      .post('/email/send')
      .set('Authorization', 'Bearer ' + apiKey)
      .send({
        sender: { email: 'testSender@gmail.com', name: 'SenderName' },
        recipients: [
          { email: 'testRecipient1@gmail.com', name: 'RecipientName1' },
          { email: 'testRecipient2@gmail.com', name: 'RecipientName2' },
        ],
        subject: 'Test email',
        content: [
          { type: 'text/plain', value: 'Test email' },
          { type: 'text/plain', value: 'Test email' },
        ],
      })
      .expect(201);
  });

  it('Send email with valid parameters (with names, recipients, cc and contents) and API Key is valid', async () => {
    return request(app.getHttpServer())
      .post('/email/send')
      .set('Authorization', 'Bearer ' + apiKey)
      .send({
        sender: { email: 'testSender@gmail.com', name: 'SenderName' },
        recipients: [
          { email: 'testRecipient1@gmail.com', name: 'RecipientName1' },
          { email: 'testRecipient2@gmail.com', name: 'RecipientName2' },
        ],
        cc: [{ email: 'testRecipient1@gmail.com', name: 'RecipientName1' }],
        subject: 'Test email',
        content: [
          { type: 'text/plain', value: 'Test email' },
          { type: 'text/plain', value: 'Test email' },
        ],
      })
      .expect(201);
  });

  it('Send email with valid parameters (with names, recipients, bcc and contents) and API Key is valid', async () => {
    return request(app.getHttpServer())
      .post('/email/send')
      .set('Authorization', 'Bearer ' + apiKey)
      .send({
        sender: { email: 'testSender@gmail.com', name: 'SenderName' },
        recipients: [
          { email: 'testRecipient1@gmail.com', name: 'RecipientName1' },
          { email: 'testRecipient2@gmail.com', name: 'RecipientName2' },
        ],
        bcc: [{ email: 'testRecipient1@gmail.com', name: 'RecipientName1' }],
        subject: 'Test email',
        content: [
          { type: 'text/plain', value: 'Test email' },
          { type: 'text/plain', value: 'Test email' },
        ],
      })
      .expect(201);
  });

  it('Send email with empty request and API Key is valid', async () => {
    return request(app.getHttpServer())
      .post('/email/send')
      .set('Authorization', 'Bearer ' + apiKey)
      .send({})
      .expect(400);
  });

  it('Send email with empty sender email and API Key is valid', async () => {
    return request(app.getHttpServer())
      .post('/email/send')
      .set('Authorization', 'Bearer ' + apiKey)
      .send({
        sender: { email: '', name: 'SenderName' },
        recipients: [
          { email: 'testRecipient1@gmail.com', name: 'RecipientName1' },
          { email: 'testRecipient2@gmail.com', name: 'RecipientName2' },
        ],
        subject: 'Test email',
        content: [
          { type: 'text/plain', value: 'Test email' },
          { type: 'text/plain', value: 'Test email' },
        ],
      })
      .expect(400);
  });

  it('Send email with invalid sender email and API Key is valid', async () => {
    return request(app.getHttpServer())
      .post('/email/send')
      .set('Authorization', 'Bearer ' + apiKey)
      .send({
        sender: { email: 'invalid-email', name: 'SenderName' },
        recipients: [
          { email: 'testRecipient1@gmail.com', name: 'RecipientName1' },
          { email: 'testRecipient2@gmail.com', name: 'RecipientName2' },
        ],
        subject: 'Test email',
        content: [
          { type: 'text/plain', value: 'Test email' },
          { type: 'text/plain', value: 'Test email' },
        ],
      })
      .expect(400);
  });

  it('Send email with null sender email and API Key is valid', async () => {
    return request(app.getHttpServer())
      .post('/email/send')
      .set('Authorization', 'Bearer ' + apiKey)
      .send({
        sender: { email: null, name: 'SenderName' },
        recipients: [
          { email: 'testRecipient1@gmail.com', name: 'RecipientName1' },
          { email: 'testRecipient2@gmail.com', name: 'RecipientName2' },
        ],
        subject: 'Test email',
        content: [
          { type: 'text/plain', value: 'Test email' },
          { type: 'text/plain', value: 'Test email' },
        ],
      })
      .expect(400);
  });

  it('Send email with empty recipients email and API Key is valid', async () => {
    return request(app.getHttpServer())
      .post('/email/send')
      .set('Authorization', 'Bearer ' + apiKey)
      .send({
        sender: { email: 'testSender@gmail.com', name: 'SenderName' },
        recipients: [
          { email: '', name: 'RecipientName1' },
          { email: 'testRecipient2@gmail.com', name: 'RecipientName2' },
        ],
        subject: 'Test email',
        content: [
          { type: 'text/plain', value: 'Test email' },
          { type: 'text/plain', value: 'Test email' },
        ],
      })
      .expect(400);
  });

  it('Send email with invalid recipients email and API Key is valid', async () => {
    return request(app.getHttpServer())
      .post('/email/send')
      .set('Authorization', 'Bearer ' + apiKey)
      .send({
        sender: { email: 'testSender@gmail.com', name: 'SenderName' },
        recipients: [
          { email: 'invalid-email', name: 'RecipientName1' },
          { email: 'testRecipient2@gmail.com', name: 'RecipientName2' },
        ],
        subject: 'Test email',
        content: [
          { type: 'text/plain', value: 'Test email' },
          { type: 'text/plain', value: 'Test email' },
        ],
      })
      .expect(400);
  });

  it('Send email with null recipients email and API Key is valid', async () => {
    return request(app.getHttpServer())
      .post('/email/send')
      .set('Authorization', 'Bearer ' + apiKey)
      .send({
        sender: { email: 'testSender@gmail.com', name: 'SenderName' },
        recipients: [
          { email: null, name: 'RecipientName1' },
          { email: 'testRecipient2@gmail.com', name: 'RecipientName2' },
        ],
        subject: 'Test email',
        content: [
          { type: 'text/plain', value: 'Test email' },
          { type: 'text/plain', value: 'Test email' },
        ],
      })
      .expect(400);
  });

  it('Send email with empty content type email and API Key is valid', async () => {
    return request(app.getHttpServer())
      .post('/email/send')
      .set('Authorization', 'Bearer ' + apiKey)
      .send({
        sender: { email: 'testSender@gmail.com', name: 'SenderName' },
        recipients: [
          { email: 'testRecipient1@gmail.com', name: 'RecipientName1' },
          { email: 'testRecipient2@gmail.com', name: 'RecipientName2' },
        ],
        subject: 'Test email',
        content: [
          { type: '', value: 'Test email' },
          { type: 'text/plain', value: 'Test email' },
        ],
      })
      .expect(400);
  });

  it('Send email with null content type email and API Key is valid', async () => {
    return request(app.getHttpServer())
      .post('/email/send')
      .set('Authorization', 'Bearer ' + apiKey)
      .send({
        sender: { email: 'testSender@gmail.com', name: 'SenderName' },
        recipients: [
          { email: 'testRecipient1@gmail.com', name: 'RecipientName1' },
          { email: 'testRecipient2@gmail.com', name: 'RecipientName2' },
        ],
        subject: 'Test email',
        content: [
          { type: null, value: 'Test email' },
          { type: 'text/plain', value: 'Test email' },
        ],
      })
      .expect(400);
  });

  it('Send email with empty content value email and API Key is valid', async () => {
    return request(app.getHttpServer())
      .post('/email/send')
      .set('Authorization', 'Bearer ' + apiKey)
      .send({
        sender: { email: 'testSender@gmail.com', name: 'SenderName' },
        recipients: [
          { email: 'testRecipient1@gmail.com', name: 'RecipientName1' },
          { email: 'testRecipient2@gmail.com', name: 'RecipientName2' },
        ],
        subject: 'Test email',
        content: [
          { type: 'text/plain', value: '' },
          { type: 'text/plain', value: 'Test email' },
        ],
      })
      .expect(400);
  });

  it('Send email with null content value email and API Key is valid', async () => {
    return request(app.getHttpServer())
      .post('/email/send')
      .set('Authorization', 'Bearer ' + apiKey)
      .send({
        sender: { email: 'testSender@gmail.com', name: 'SenderName' },
        recipients: [
          { email: 'testRecipient1@gmail.com', name: 'RecipientName1' },
          { email: 'testRecipient2@gmail.com', name: 'RecipientName2' },
        ],
        subject: 'Test email',
        content: [
          { type: 'text/plain', value: null },
          { type: 'text/plain', value: 'Test email' },
        ],
      })
      .expect(400);
  });
});

describe('Domain Registration Routes', () => {
  it('Registers a domain without a domain parameter', () => {
    return request(app.getHttpServer())
      .post('/email/register-domain')
      .set('Authorization', 'Bearer ' + apiKey)
      .expect(400);
  });

  it('Registers a domain with valid parameters', () => {
    return request(app.getHttpServer())
      .post('/email/register-domain')
      .set('Authorization', 'Bearer ' + apiKey)
      .send({
        domain: 'example.com',
        subdomain: 'sub',
      })
      .expect(201);
  });

  it('Registration endpoint called with no Authorization header', () => {
    return request(app.getHttpServer())
      .post('/email/register-domain')
      .send({
        domain: 'example.com',
        subdomain: 'sub',
      })
      .expect(401);
  });

  it('Registration endpoint called with an invalid API Key', () => {
    return request(app.getHttpServer())
      .post('/email/register-domain')
      .set('Authorization', 'Bearer invalid.api.key')
      .send({
        domain: 'example.com',
        subdomain: 'sub',
      })
      .expect(401);
  });
});

describe('Email Senders Routes', () => {
  it('Lists a sender registered earlier in this suite', async () => {
    const response = await request(app.getHttpServer())
      .get('/email/senders')
      .set('Authorization', 'Bearer ' + apiKey)
      .expect(200);

    expect(response.body.senders).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          fromEmail: 'validemail@example.com',
          fromName: 'name',
          verified: false,
        }),
      ]),
    );
  });

  it("Accepts an explicit x-project-id for the key's own project", async () => {
    const response = await request(app.getHttpServer())
      .get('/email/senders')
      .set('Authorization', 'Bearer ' + apiKey)
      .set('x-project-id', '0')
      .expect(200);

    expect(Array.isArray(response.body.senders)).toBe(true);
  });

  it('Fails with a malformed x-project-id', async () => {
    return request(app.getHttpServer())
      .get('/email/senders')
      .set('Authorization', 'Bearer ' + apiKey)
      .set('x-project-id', 'abc')
      .expect(400);
  });

  it('Fails without an Authorization header', async () => {
    return request(app.getHttpServer()).get('/email/senders').expect(401);
  });

  it('Fails with an invalid API Key', async () => {
    return request(app.getHttpServer())
      .get('/email/senders')
      .set('Authorization', 'Bearer invalid.api.key')
      .expect(401);
  });
});

describe('Email Domains Routes', () => {
  it('Lists a domain registered earlier in this suite', async () => {
    const response = await request(app.getHttpServer())
      .get('/email/domains')
      .set('Authorization', 'Bearer ' + apiKey)
      .expect(200);

    expect(response.body.domains).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          domain: 'example.com',
          subdomain: 'sub',
          valid: false,
        }),
      ]),
    );
  });

  it("Accepts an explicit x-project-id for the key's own project", async () => {
    const response = await request(app.getHttpServer())
      .get('/email/domains')
      .set('Authorization', 'Bearer ' + apiKey)
      .set('x-project-id', '0')
      .expect(200);

    expect(Array.isArray(response.body.domains)).toBe(true);
  });

  it('Fails with a malformed x-project-id', async () => {
    return request(app.getHttpServer())
      .get('/email/domains')
      .set('Authorization', 'Bearer ' + apiKey)
      .set('x-project-id', 'abc')
      .expect(400);
  });

  it('Fails without an Authorization header', async () => {
    return request(app.getHttpServer()).get('/email/domains').expect(401);
  });

  it('Fails with an invalid API Key', async () => {
    return request(app.getHttpServer())
      .get('/email/domains')
      .set('Authorization', 'Bearer invalid.api.key')
      .expect(401);
  });
});

describe('Domain Verification Routes', () => {
  it('Verifies a domain without a domain parameter', () => {
    return request(app.getHttpServer())
      .post('/email/verify-domain')
      .set('Authorization', 'Bearer ' + apiKey)
      .expect(400);
  });

  it('Verifies a domain with valid parameters', async () => {
    // Register first so the test doesn't depend on seeded data.
    await request(app.getHttpServer())
      .post('/email/register-domain')
      .set('Authorization', 'Bearer ' + apiKey)
      .send({
        domain: 'verify-me.example.com',
      })
      .expect(201);

    return request(app.getHttpServer())
      .post('/email/verify-domain')
      .set('Authorization', 'Bearer ' + apiKey)
      .send({
        domain: 'verify-me.example.com',
      })
      .expect(201);
  });

  it('Fails to verify a domain that was never registered', () => {
    return request(app.getHttpServer())
      .post('/email/verify-domain')
      .set('Authorization', 'Bearer ' + apiKey)
      .send({
        domain: 'never-registered.example.com',
      })
      .expect(404);
  });

  it('Verification endpoint called with no Authorization header', () => {
    return request(app.getHttpServer())
      .post('/email/verify-domain')
      .send({
        domain: 'testdomain',
      })
      .expect(401);
  });

  it('Verification endpoint called with an invalid API Key', () => {
    return request(app.getHttpServer())
      .post('/email/verify-domain')
      .set('Authorization', 'Bearer invalid.jwt.token')
      .send({
        domain: 'testdomain',
      })
      .expect(401);
  });
});

describe('Email Project Scoping', () => {
  describe.each(['/email/senders', '/email/domains'])('GET %s', (route) => {
    it('Succeeds for a user linked to the project (x-user-jwt + x-project-id)', async () => {
      const f = await getScopingFixtures();
      await request(app.getHttpServer())
        .get(route)
        .set('Authorization', 'Bearer ' + apiKey)
        .set('x-user-jwt', f.scopedAdminJwt)
        .set('x-project-id', String(f.projectAId))
        .expect(200);
    });

    it('Fails with 401 for a user linked to a different project', async () => {
      const f = await getScopingFixtures();
      await request(app.getHttpServer())
        .get(route)
        .set('Authorization', 'Bearer ' + apiKey)
        .set('x-user-jwt', f.scopedAdminJwt)
        .set('x-project-id', String(f.projectBId))
        .expect(401);
    });

    it('Fails with 401 for a user linked to no project', async () => {
      const f = await getScopingFixtures();
      await request(app.getHttpServer())
        .get(route)
        .set('Authorization', 'Bearer ' + apiKey)
        .set('x-user-jwt', f.unlinkedUserJwt)
        .set('x-project-id', String(f.projectAId))
        .expect(401);
    });
  });

  it("Does not list one project's registered domain under another project", async () => {
    const f = await getScopingFixtures();
    await request(app.getHttpServer())
      .post('/email/register-domain')
      .set('Authorization', 'Bearer ' + f.apiKeyA)
      .send({ domain: 'listed-on-a.example.com' })
      .expect(201);

    const listA = await request(app.getHttpServer())
      .get('/email/domains')
      .set('Authorization', 'Bearer ' + f.apiKeyA)
      .expect(200);
    const listB = await request(app.getHttpServer())
      .get('/email/domains')
      .set('Authorization', 'Bearer ' + f.apiKeyB)
      .expect(200);

    expect(listA.body.domains).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ domain: 'listed-on-a.example.com' }),
      ]),
    );
    expect(listB.body.domains).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ domain: 'listed-on-a.example.com' }),
      ]),
    );
  });

  it("Does not let a project verify another project's domain", async () => {
    const f = await getScopingFixtures();
    await request(app.getHttpServer())
      .post('/email/register-domain')
      .set('Authorization', 'Bearer ' + f.apiKeyA)
      .send({ domain: 'owned-by-a.example.com' })
      .expect(201);

    const asB = await request(app.getHttpServer())
      .post('/email/verify-domain')
      .set('Authorization', 'Bearer ' + f.apiKeyB)
      .send({ domain: 'owned-by-a.example.com' })
      .expect(404);
    expect(asB.text).toContain('Domain not found');

    await request(app.getHttpServer())
      .post('/email/verify-domain')
      .set('Authorization', 'Bearer ' + f.apiKeyA)
      .send({ domain: 'owned-by-a.example.com' })
      .expect(201);
  });

  it('Rejects a SendGrid key that another project already uses', async () => {
    const f = await getScopingFixtures();
    const res = await request(app.getHttpServer())
      .post('/email/setup')
      .set('Authorization', 'Bearer ' + f.apiKeyB)
      .send({ sendgridKey: 'scoping-key-a' })
      .expect(409);
    expect(res.text).toContain('already in use');
  });

  it('Allows a project to re-save its own SendGrid key', async () => {
    const f = await getScopingFixtures();
    await request(app.getHttpServer())
      .post('/email/setup')
      .set('Authorization', 'Bearer ' + f.apiKeyA)
      .send({ sendgridKey: 'scoping-key-a' })
      .expect(201);
  });
});
