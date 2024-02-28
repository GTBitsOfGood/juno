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
      .post('/email/register')
      .set('Authorization', 'Bearer ' + token)
      .expect(400);
  });
  it('Has been called with a malformed emaiil', () => {
    const token = jwt.sign({}, 'secret');
    return request(app.getHttpServer())
      .post('/email/register')
      .set('Authorization', 'Bearer ' + token)
      .send({
        email: 'invalidemail', // Malformed email
      })
      .expect(400);
  });
  it('Registration endpoint called with no Authorization header', () => {
    return request(app.getHttpServer())
      .post('/email/register')
      .send({
        email: 'validemail@example.com',
      })
      .expect(401);
  });
  it('Registration endpoint called with an invalid JWT', () => {
    return request(app.getHttpServer())
      .post('/email/register')
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
      .post('/email/register')
      .set('Authorization', 'Bearer ' + token)
      .send({
        email: 'validemail@example.com',
      })
      .expect(201); // Assuming the server responds with 201 Created on successful registration
  });
});
