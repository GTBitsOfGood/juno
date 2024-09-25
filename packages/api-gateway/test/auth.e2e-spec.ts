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

let app: INestApplication;
const ADMIN_EMAIL = 'test-superadmin@test.com';
const ADMIN_PASSWORD = 'test-password';

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

describe('Invalid key push to get jwt route', () => {
  it('Invalid email parameter to /auth/key', () => {
    return request(app.getHttpServer())
      .post('/auth/key')
      .send({
        email: 'invalid-email@gmail.com',
        password: ADMIN_PASSWORD,
        environment: 'prod',
        project: {
          name: 'test-seed-project',
        },
      })
      .expect(400);
  });

  it('Invalid password parameter to /auth/key', () => {
    return request(app.getHttpServer())
      .post('/auth/key')
      .send({
        email: ADMIN_EMAIL,
        password: 'invalid-passowrd',
        environment: 'prod',
        project: {
          name: 'test-seed-project',
        },
      })
      .expect(400);
  });

  it('Different environment parameter to /auth/key', () => {
    return request(app.getHttpServer())
      .post('/auth/key')
      .send({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        environment: 'staging',
        project: {
          name: 'invalid-project-name',
        },
      })
      .expect(200);
  });

  it('Invalid project name to /auth/key', () => {
    return request(app.getHttpServer())
      .post('/auth/key')
      .send({
        email: ADMIN_EMAIL,
        password: 'invalid-passowrd',
        environment: 'prod',
        project: {
          name: 'invalid-project-name',
        },
      })
      .expect(400);
  });
});

describe('Malformed paramters to get jwt route', () => {
  it('Empty api key request', () => {
    return request(app.getHttpServer()).post('/auth/jwt').send().expect(400);
  });

  it('Malformed api key request', async () => {
    const key = await request(app.getHttpServer())
      .post('/auth/key')
      .send({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        environment: 'prod',
        project: {
          name: 'test-seed-project',
        },
      });
    const apiKey = key.body['apiKey'] + 'test';

    return request(app.getHttpServer())
      .post('/auth/jwt')
      .set('Authorization', `Bearer ${apiKey}`)
      .send()
      .expect(400);
  });
});

describe('Correct parameters to both generate auth key and jwt', () => {
  it('Valid api key', async () => {
    const key = await request(app.getHttpServer())
      .post('/auth/key')
      .send({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        environment: 'prod',
        project: {
          name: 'test-seed-project',
        },
      });
    const apiKey = key.body['apiKey'];

    return request(app.getHttpServer())
      .post('/auth/jwt')
      .set('Authorization', `Bearer ${apiKey}`)
      .send()
      .expect(200);
  });
});
