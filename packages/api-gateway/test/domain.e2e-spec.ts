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

describe('Domain Verification and Registration Routes', () => {
  it('Calling the registration endpoint with no Authorization header', () => {
    return request(app.getHttpServer())
      .post('/domain/register')
      .set({ domain: 'example.com', subdomain: 'news' })
      .expect(401);
  });
  it('Calling the registration endpoint with malformed domain/subdomain parameters', () => {
    const token = jwt.sign({}, 'secret');
    return request(app.getHttpServer())
      .post('/domain/register')
      .set('Authorization', 'Bearer ' + token)
      .set({ domain: 'example.com123', subdomain: 'news' })
      .expect(400);
  });
  it('Calling the registration endpoint with missing domain/subdomain parameters', () => {
    const token = jwt.sign({}, 'secret');
    return request(app.getHttpServer())
      .post('/domain/register')
      .set('Authorization', 'Bearer ' + token)
      .set({ domain: 'example.com' })
      .expect(400);
  });
  it('Calling the registration endpoint with correct domain/subdomain parameters', () => {
    const token = jwt.sign({}, 'secret');
    return request(app.getHttpServer())
      .post('/domain/register')
      .set('Authorization', 'Bearer ' + token)
      .set({ domain: 'example.com', subdomain: 'news' })
      .expect(200);
  });
  it('Calling the validation endpoint with no Authorization header', () => {
    return request(app.getHttpServer())
      .post('/domain/verify')
      .set({ domain: 'example.com' })
      .expect(401);
  });
  it('Calling the validation endpoint with malformed a domain parameter', () => {
    const token = jwt.sign({}, 'secret');
    return request(app.getHttpServer())
      .post('/domain/verify')
      .set('Authorization', 'Bearer ' + token)
      .set({ domain: 'example.com123' })
      .expect(400);
  });
  it('Calling the validation endpoint with a missing domain parameter', () => {
    const token = jwt.sign({}, 'secret');
    return request(app.getHttpServer())
      .post('/domain/verify')
      .set('Authorization', 'Bearer ' + token)
      .set({})
      .expect(400);
  });
  it('Calling the validation endpoint with a correct domain parameter', () => {
    const token = jwt.sign({}, 'secret');
    return request(app.getHttpServer())
      .post('/domain/verify')
      .set('Authorization', 'Bearer ' + token)
      .set({ domain: 'example.com' })
      .expect(200);
  });
});
