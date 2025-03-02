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
import { sign } from 'jsonwebtoken';
import * as jwt from 'jsonwebtoken';
import { RpcExceptionFilter } from 'src/rpc_exception_filter';

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
  app.useGlobalFilters(new RpcExceptionFilter());

  await app.init();
});

describe('Auth Key Verification Routes', () => {
  it('Invalid email parameter when getting auth key', () => {
    return request(app.getHttpServer())
      .post('/auth/key')
      .set('X-User-Email', 'invalid-email@gmail.com')
      .set('X-User-Password', ADMIN_PASSWORD)
      .send({
        environment: 'prod',
        project: {
          name: 'test-seed-project',
        },
      })
      .expect(401);
  });

  it('Invalid password parameter when generating auth key', () => {
    return request(app.getHttpServer())
      .post('/auth/key')
      .set('X-User-Email', ADMIN_EMAIL)
      .set('X-User-Password', 'invalid-password')
      .send({
        environment: 'prod',
        project: {
          name: 'test-seed-project',
        },
      })
      .expect(401);
  });

  it('Different environment parameter to /auth/key', () => {
    return request(app.getHttpServer())
      .post('/auth/key')
      .set('X-User-Email', ADMIN_EMAIL)
      .set('X-User-Password', ADMIN_PASSWORD)
      .send({
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
      .set('X-User-Email', ADMIN_EMAIL)
      .set('X-User-Password', ADMIN_PASSWORD)
      .send({
        environment: 'prod',
        project: {
          name: 'invalid-project-name',
        },
      })
      .expect(400);
  });
});

describe('API Key JWT Verification Routes', () => {
  it('Missing authorization header', () => {
    return request(app.getHttpServer())
      .post('/auth/api_key/jwt')
      .send()
      .expect(401);
  });

  it('Empty bearer authorization header', () => {
    return request(app.getHttpServer())
      .post('/auth/api_key/jwt')
      .set('Authorization', `Bearer `)
      .send()
      .expect(401);
  });

  it('Malformed api key request', async () => {
    return request(app.getHttpServer())
      .post('/auth/api_key/jwt')
      .set('Authorization', `Bearer invalid.jwt.token`)
      .send()
      .expect(401);
  });

  it('Expired JWT api key', async () => {
    const key = await request(app.getHttpServer())
      .post('/auth/key')
      .set('X-User-Email', ADMIN_EMAIL)
      .set('X-User-Password', ADMIN_PASSWORD)
      .send({
        environment: 'prod',
        project: {
          name: 'test-seed-project',
        },
      });

    // create a jwt token that expires 30 seconds before the request
    const apiKey = sign(
      { data: key.body['apiKey'] },
      process.env.JWT_SECRET ?? 'secret',
      {
        expiresIn: Math.floor(Date.now() / 1000) - 30,
      },
    );

    return request(app.getHttpServer())
      .post('/auth/api_key/jwt')
      .set('Authorization', `Bearer ${apiKey}`)
      .send()
      .expect(401);
  });

  it('Expected valid request for auth key and jwt generation', async () => {
    const key = await request(app.getHttpServer())
      .post('/auth/key')
      .set('X-User-Email', ADMIN_EMAIL)
      .set('X-User-Password', ADMIN_PASSWORD)
      .send({
        environment: 'prod',
        project: {
          name: 'test-seed-project',
        },
      });

    expect(key.body['apiKey']).toBeDefined();

    const apiKey = key.body['apiKey'];

    return request(app.getHttpServer())
      .post('/auth/api_key/jwt')
      .set('Authorization', `Bearer ${apiKey}`)
      .send()
      .expect(201);
  });
});

describe('Auth Middleware Tests using test-auth endpoint', () => {
  it('validates with API key only', async () => {
    const key = await request(app.getHttpServer())
      .post('/auth/key')
      .set('X-User-Email', ADMIN_EMAIL)
      .set('X-User-Password', ADMIN_PASSWORD)
      .send({
        environment: 'prod',
        project: {
          name: 'test-seed-project',
        },
      });

    // use the API key with our test endpoint
    const response = await request(app.getHttpServer())
      .get('/auth/test-auth')
      .set('Authorization', `Bearer ${key.body['apiKey']}`)
      .send();

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
  });

  it('validates with JWT only', async () => {
    // get a valid API key
    const key = await request(app.getHttpServer())
      .post('/auth/key')
      .set('X-User-Email', ADMIN_EMAIL)
      .set('X-User-Password', ADMIN_PASSWORD)
      .send({
        environment: 'prod',
        project: {
          name: 'test-seed-project',
        },
      });

    // get a JWT using the API key
    const jwtResponse = await request(app.getHttpServer())
      .post('/auth/api_key/jwt')
      .set('Authorization', `Bearer ${key.body['apiKey']}`)
      .send();

    expect(jwtResponse.status).toBe(201);
    expect(jwtResponse.body.token).toBeDefined();

    // use that JWT with our test endpoint
    const response = await request(app.getHttpServer())
      .get('/auth/test-auth')
      .set('Authorization', `Bearer ${jwtResponse.body.token}`)
      .send();

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
  });

  it('fail when both API key and JWT are invalid', async () => {
    return request(app.getHttpServer())
      .get('/auth/test-auth')
      .set('Authorization', 'Bearer not.a.valid.api.key.or.jwt')
      .send()
      .expect(401);
  });

  it('accepts valid API key directly', async () => {
    // Get a valid API key
    const key = await request(app.getHttpServer())
      .post('/auth/key')
      .set('X-User-Email', ADMIN_EMAIL)
      .set('X-User-Password', ADMIN_PASSWORD)
      .send({
        environment: 'prod',
        project: {
          name: 'test-seed-project',
        },
      });

    // Try to use the API key with our test endpoint
    const response = await request(app.getHttpServer())
      .get('/auth/test-auth')
      .set('Authorization', `Bearer ${key.body['apiKey']}`)
      .send();

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
  });
});

describe('User JWT Verification Routes', () => {
  it('Missing credentials', () => {
    return request(app.getHttpServer())
      .post('/auth/user/jwt')
      .send()
      .expect(401);
  });

  it('Empty email/pass header', () => {
    return request(app.getHttpServer())
      .post('/auth/user/jwt')
      .set('X-User-Email', ``)
      .set('X-User-Password', 'password')
      .send()
      .expect(401);
  });

  it('Invalid password', () => {
    return request(app.getHttpServer())
      .post('/auth/user/jwt')
      .set('X-User-Email', ADMIN_EMAIL)
      .set('X-User-Password', 'invalid-password')
      .send()
      .expect(401);
  });

  it('generates a valid JWT', async () => {
    const key = await request(app.getHttpServer())
      .post('/auth/user/jwt')
      .set('X-User-Email', ADMIN_EMAIL)
      .set('X-User-Password', ADMIN_PASSWORD)
      .send()
      .expect(201);

    expect(key.body['token']).toBeDefined();

    const result = jwt.verify(
      key.body['token'],
      process.env.JWT_SECRET ?? 'secret',
    );
    return expect(result['user']['email']).toEqual(ADMIN_EMAIL);
  });
});
