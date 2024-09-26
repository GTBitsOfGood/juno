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
import jwt from 'jsonwebtoken';

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

describe('Auth Key Verification Routes', () => {
  it('Invalid email parameter when getting auth key', () => {
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
      .expect(500);
  });

  it('Invalid password parameter when generating auth key', () => {
    return request(app.getHttpServer())
      .post('/auth/key')
      .send({
        email: ADMIN_EMAIL,
        password: 'invalid-password',
        environment: 'prod',
        project: {
          name: 'test-seed-project',
        },
      })
      .expect(500);
  });

  it('Different environment parameter to /auth/key', () => {
    return request(app.getHttpServer())
      .post('/auth/key')
      .send({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        environment: 'staging',
        project: {
          name: 'test-seed-project',
        },
      })
      .expect(201);
  });

  it('Invalid project name when generating auth key', () => {
    return request(app.getHttpServer())
      .post('/auth/key')
      .send({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        environment: 'prod',
        project: {
          name: 'invalid-project-name',
        },
      })
      .expect(500);
  });
});

describe('JWT Verification Routes', () => {
  it('Missing authorization header', () => {
    return request(app.getHttpServer()).post('/auth/jwt').send().expect(401);
  });

  it('Empty bearer authorization header', () => {
    return request(app.getHttpServer())
      .post('/auth/jwt')
      .set('Authorization', `Bearer `)
      .send()
      .expect(401);
  });

  it('Malformed api key request', async () => {
    return request(app.getHttpServer())
      .post('/auth/jwt')
      .set('Authorization', `Bearer invalid.jwt.token`)
      .send()
      .expect(500);
  });

  it('Expired JWT api key', async () => {
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

    // create a jwt token that expires 30 seconds before the request
    const apiKey = jwt.sign({ data: key.body['apiKey'] }, 'secret', {
      expiresIn: Math.floor(Date.now() / 1000) - 30,
    });

    return request(app.getHttpServer())
      .post('/auth/jwt')
      .set('Authorization', `Bearer ${apiKey}`)
      .send()
      .expect(500);
  });

  it('Expected valid request for auth key and jwt generation', async () => {
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

    let apiKey = '';
    if (key.body['apiKey']) {
      apiKey = key.body['apiKey'] + apiKey;
    }

    return request(app.getHttpServer())
      .post('/auth/jwt')
      .set('Authorization', `Bearer ${apiKey}`)
      .send()
      .expect(201);
  });
});
