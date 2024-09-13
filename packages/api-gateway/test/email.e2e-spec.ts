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
import * as jwt from 'jsonwebtoken';
let app: INestApplication;

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

  await app.init();
});

describe('Email Registration Routes', () => {
  it('Registers an email without a body', () => {
    const token = jwt.sign({}, 'secret');
    return request(app.getHttpServer())
      .post('/email/register-sender')
      .set('Authorization', 'Bearer ' + token)
      .expect(400);
  });
  it('Has been called with a malformed emaiil', () => {
    const token = jwt.sign({}, 'secret');
    return request(app.getHttpServer())
      .post('/email/register-sender')
      .set('Authorization', 'Bearer ' + token)
      .send({
        email: 'invalidemail', // Malformed email
      })
      .expect(400);
  });
  it('Registration endpoint called with no Authorization header', () => {
    return request(app.getHttpServer())
      .post('/email/register-sender')
      .send({
        email: 'validemail@example.com',
      })
      .expect(401);
  });
  it('Registration endpoint called with an invalid JWT', () => {
    return request(app.getHttpServer())
      .post('/email/register-sender')
      .set('Authorization', 'Bearer invalid.jwt.token')
      .send({
        email: 'validemail@example.com',
      })
      .expect(401);
  });
  it('Registration endpoint called with a correct payload (header + body)', () => {
    // Assuming 'valid.jwt.token' is a placeholder for a valid JWT obtained in a way relevant to your test setup
    const token = jwt.sign({}, 'secret');
    return request(app.getHttpServer())
      .post('/email/register-sender')
      .set('Authorization', 'Bearer ' + token)
      .send({
        email: 'validemail@example.com',
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
      })
      .expect(401);
  });

  it('should return 401 when JWT is invalid', async () => {
    return request(app.getHttpServer())
      .post('/email/send')
      .set('Authorization', 'Bearer invalid_token')
      .send({
        sender: { email: 'testSender@gmail.com' },
        recipients: [{ email: 'testRecipient@gmail.com' }],
        content: [{ type: 'text/plain', value: 'Test email' }],
      })
      .expect(401);
  });

  it('Send email with valid parameters and JWT is valid', async () => {
    const token = jwt.sign({}, 'secret');
    return request(app.getHttpServer())
      .post('/email/send')
      .set('Authorization', 'Bearer ' + token)
      .send({
        sender: { email: 'testSender@gmail.com' },
        recipients: [{ email: 'testRecipient@gmail.com' }],
        content: [{ type: 'text/plain', value: 'Test email' }],
      })
      .expect(201);
  });

  it('Send email with valid parameters (with names) and JWT is valid', async () => {
    const token = jwt.sign({}, 'secret');
    return request(app.getHttpServer())
      .post('/email/send')
      .set('Authorization', 'Bearer ' + token)
      .send({
        sender: { email: 'testSender@gmail.com', name: 'SenderName' },
        recipients: [
          { email: 'testRecipient@gmail.com', name: 'RecipientName' },
        ],
        content: [{ type: 'text/plain', value: 'Test email' }],
      })
      .expect(201);
  });

  it('Send email with valid parameters (with names, multiple recipients) and JWT is valid', async () => {
    const token = jwt.sign({}, 'secret');
    return request(app.getHttpServer())
      .post('/email/send')
      .set('Authorization', 'Bearer ' + token)
      .send({
        sender: { email: 'testSender@gmail.com', name: 'SenderName' },
        recipients: [
          { email: 'testRecipient1@gmail.com', name: 'RecipientName1' },
          { email: 'testRecipient2@gmail.com', name: 'RecipientName2' },
        ],
        content: [{ type: 'text/plain', value: 'Test email' }],
      })
      .expect(201);
  });

  it('Send email with valid parameters (with names, multiple recipients and contents) and JWT is valid', async () => {
    const token = jwt.sign({}, 'secret');
    return request(app.getHttpServer())
      .post('/email/send')
      .set('Authorization', 'Bearer ' + token)
      .send({
        sender: { email: 'testSender@gmail.com', name: 'SenderName' },
        recipients: [
          { email: 'testRecipient1@gmail.com', name: 'RecipientName1' },
          { email: 'testRecipient2@gmail.com', name: 'RecipientName2' },
        ],
        content: [
          { type: 'text/plain', value: 'Test email' },
          { type: 'text/plain', value: 'Test email' },
        ],
      })
      .expect(201);
  });

  it('Send email with empty request and JWT is valid', async () => {
    const token = jwt.sign({}, 'secret');
    return request(app.getHttpServer())
      .post('/email/send')
      .set('Authorization', 'Bearer ' + token)
      .send({})
      .expect(400);
  });

  it('Send email with empty sender email and JWT is valid', async () => {
    const token = jwt.sign({}, 'secret');
    return request(app.getHttpServer())
      .post('/email/send')
      .set('Authorization', 'Bearer ' + token)
      .send({
        sender: { email: '', name: 'SenderName' },
        recipients: [
          { email: 'testRecipient1@gmail.com', name: 'RecipientName1' },
          { email: 'testRecipient2@gmail.com', name: 'RecipientName2' },
        ],
        content: [
          { type: 'text/plain', value: 'Test email' },
          { type: 'text/plain', value: 'Test email' },
        ],
      })
      .expect(400);
  });

  it('Send email with invalid sender email and JWT is valid', async () => {
    const token = jwt.sign({}, 'secret');
    return request(app.getHttpServer())
      .post('/email/send')
      .set('Authorization', 'Bearer ' + token)
      .send({
        sender: { email: 'invalid-email', name: 'SenderName' },
        recipients: [
          { email: 'testRecipient1@gmail.com', name: 'RecipientName1' },
          { email: 'testRecipient2@gmail.com', name: 'RecipientName2' },
        ],
        content: [
          { type: 'text/plain', value: 'Test email' },
          { type: 'text/plain', value: 'Test email' },
        ],
      })
      .expect(400);
  });

  it('Send email with null sender email and JWT is valid', async () => {
    const token = jwt.sign({}, 'secret');
    return request(app.getHttpServer())
      .post('/email/send')
      .set('Authorization', 'Bearer ' + token)
      .send({
        sender: { email: null, name: 'SenderName' },
        recipients: [
          { email: 'testRecipient1@gmail.com', name: 'RecipientName1' },
          { email: 'testRecipient2@gmail.com', name: 'RecipientName2' },
        ],
        content: [
          { type: 'text/plain', value: 'Test email' },
          { type: 'text/plain', value: 'Test email' },
        ],
      })
      .expect(400);
  });

  it('Send email with empty recipients email and JWT is valid', async () => {
    const token = jwt.sign({}, 'secret');
    return request(app.getHttpServer())
      .post('/email/send')
      .set('Authorization', 'Bearer ' + token)
      .send({
        sender: { email: 'testSender@gmail.com', name: 'SenderName' },
        recipients: [
          { email: '', name: 'RecipientName1' },
          { email: 'testRecipient2@gmail.com', name: 'RecipientName2' },
        ],
        content: [
          { type: 'text/plain', value: 'Test email' },
          { type: 'text/plain', value: 'Test email' },
        ],
      })
      .expect(400);
  });

  it('Send email with invalid recipients email and JWT is valid', async () => {
    const token = jwt.sign({}, 'secret');
    return request(app.getHttpServer())
      .post('/email/send')
      .set('Authorization', 'Bearer ' + token)
      .send({
        sender: { email: 'testSender@gmail.com', name: 'SenderName' },
        recipients: [
          { email: 'invalid-email', name: 'RecipientName1' },
          { email: 'testRecipient2@gmail.com', name: 'RecipientName2' },
        ],
        content: [
          { type: 'text/plain', value: 'Test email' },
          { type: 'text/plain', value: 'Test email' },
        ],
      })
      .expect(400);
  });

  it('Send email with null recipients email and JWT is valid', async () => {
    const token = jwt.sign({}, 'secret');
    return request(app.getHttpServer())
      .post('/email/send')
      .set('Authorization', 'Bearer ' + token)
      .send({
        sender: { email: 'testSender@gmail.com', name: 'SenderName' },
        recipients: [
          { email: null, name: 'RecipientName1' },
          { email: 'testRecipient2@gmail.com', name: 'RecipientName2' },
        ],
        content: [
          { type: 'text/plain', value: 'Test email' },
          { type: 'text/plain', value: 'Test email' },
        ],
      })
      .expect(400);
  });

  it('Send email with empty content type email and JWT is valid', async () => {
    const token = jwt.sign({}, 'secret');
    return request(app.getHttpServer())
      .post('/email/send')
      .set('Authorization', 'Bearer ' + token)
      .send({
        sender: { email: 'testSender@gmail.com', name: 'SenderName' },
        recipients: [
          { email: 'testRecipient1@gmail.com', name: 'RecipientName1' },
          { email: 'testRecipient2@gmail.com', name: 'RecipientName2' },
        ],
        content: [
          { type: '', value: 'Test email' },
          { type: 'text/plain', value: 'Test email' },
        ],
      })
      .expect(400);
  });

  it('Send email with null content type email and JWT is valid', async () => {
    const token = jwt.sign({}, 'secret');
    return request(app.getHttpServer())
      .post('/email/send')
      .set('Authorization', 'Bearer ' + token)
      .send({
        sender: { email: 'testSender@gmail.com', name: 'SenderName' },
        recipients: [
          { email: 'testRecipient1@gmail.com', name: 'RecipientName1' },
          { email: 'testRecipient2@gmail.com', name: 'RecipientName2' },
        ],
        content: [
          { type: null, value: 'Test email' },
          { type: 'text/plain', value: 'Test email' },
        ],
      })
      .expect(400);
  });

  it('Send email with empty content value email and JWT is valid', async () => {
    const token = jwt.sign({}, 'secret');
    return request(app.getHttpServer())
      .post('/email/send')
      .set('Authorization', 'Bearer ' + token)
      .send({
        sender: { email: 'testSender@gmail.com', name: 'SenderName' },
        recipients: [
          { email: 'testRecipient1@gmail.com', name: 'RecipientName1' },
          { email: 'testRecipient2@gmail.com', name: 'RecipientName2' },
        ],
        content: [
          { type: 'text/plain', value: '' },
          { type: 'text/plain', value: 'Test email' },
        ],
      })
      .expect(400);
  });

  it('Send email with null content value email and JWT is valid', async () => {
    const token = jwt.sign({}, 'secret');
    return request(app.getHttpServer())
      .post('/email/send')
      .set('Authorization', 'Bearer ' + token)
      .send({
        sender: { email: 'testSender@gmail.com', name: 'SenderName' },
        recipients: [
          { email: 'testRecipient1@gmail.com', name: 'RecipientName1' },
          { email: 'testRecipient2@gmail.com', name: 'RecipientName2' },
        ],
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
    const token = jwt.sign({}, 'secret');
    return request(app.getHttpServer())
      .post('/email/register-domain')
      .set('Authorization', 'Bearer ' + token)
      .expect(400);
  });

  it('Registers a domain with valid parameters', () => {
    const token = jwt.sign({}, 'secret');
    return request(app.getHttpServer())
      .post('/email/register-domain')
      .set('Authorization', 'Bearer ' + token)
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

  it('Registration endpoint called with an invalid JWT', () => {
    return request(app.getHttpServer())
      .post('/email/register-domain')
      .set('Authorization', 'Bearer invalid.jwt.token')
      .send({
        domain: 'example.com',
        subdomain: 'sub',
      })
      .expect(401);
  });
});
