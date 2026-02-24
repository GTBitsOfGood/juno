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
  it('fail when both API key and JWT are invalid', async () => {
    return request(app.getHttpServer())
      .get('/auth/test-auth')
      .set('Authorization', 'Bearer not.a.valid.api.key.or.jwt')
      .send()
      .expect(401);
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

describe('Account Request - POST /auth/account-request', () => {
  it('should create a new account request with valid data', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/account-request')
      .send({
        email: 'newuser@example.com',
        name: 'New User',
        password: 'securepassword',
        userType: 'USER',
        projectName: 'my-project',
      })
      .expect(201);

    expect(response.body.id).toBeDefined();
    expect(response.body.email).toBe('newuser@example.com');
    expect(response.body.name).toBe('New User');
    expect(response.body.userType).toBe('USER');
    expect(response.body.projectName).toBe('my-project');
    expect(response.body.createdAt).toBeDefined();
  });

  it('should reject request with missing email', () => {
    return request(app.getHttpServer())
      .post('/auth/account-request')
      .send({
        name: 'No Email',
        password: 'securepassword',
        userType: 'USER',
      })
      .expect(400);
  });

  it('should reject request with invalid email', () => {
    return request(app.getHttpServer())
      .post('/auth/account-request')
      .send({
        email: 'not-an-email',
        name: 'Bad Email',
        password: 'securepassword',
        userType: 'USER',
      })
      .expect(400);
  });

  it('should reject request with password shorter than 6 characters', () => {
    return request(app.getHttpServer())
      .post('/auth/account-request')
      .send({
        email: 'valid@example.com',
        name: 'Short Password',
        password: '12345',
        userType: 'USER',
      })
      .expect(400);
  });

  it('should reject request with invalid userType', () => {
    return request(app.getHttpServer())
      .post('/auth/account-request')
      .send({
        email: 'valid@example.com',
        name: 'Bad Type',
        password: 'securepassword',
        userType: 'INVALID_ROLE',
      })
      .expect(400);
  });
});

describe('Account Request - GET /auth/account-request', () => {
  it('should return all requests for an admin user', async () => {
    await request(app.getHttpServer())
      .post('/auth/account-request')
      .send({
        email: 'getall-test@example.com',
        name: 'Get All Test',
        password: 'securepassword',
        userType: 'USER',
      })
      .expect(201);

    const response = await request(app.getHttpServer())
      .get('/auth/account-request')
      .set('X-User-Email', ADMIN_EMAIL)
      .set('X-User-Password', ADMIN_PASSWORD)
      .expect(200);

    expect(response.body.requests).toBeDefined();
    expect(Array.isArray(response.body.requests)).toBe(true);
    expect(response.body.requests.length).toBeGreaterThanOrEqual(1);

    const emails = response.body.requests.map((r: any) => r.email);
    expect(emails).toContain('getall-test@example.com');
  });

  it('should reject unauthenticated requests', () => {
    return request(app.getHttpServer())
      .get('/auth/account-request')
      .expect(401);
  });

  it('should reject requests from a regular USER', async () => {
    await request(app.getHttpServer())
      .post('/user')
      .set('X-User-Email', ADMIN_EMAIL)
      .set('X-User-Password', ADMIN_PASSWORD)
      .send({
        password: 'userpass',
        name: 'Regular User',
        email: 'regularuser-getall@example.com',
      })
      .expect(201);

    return request(app.getHttpServer())
      .get('/auth/account-request')
      .set('X-User-Email', 'regularuser-getall@example.com')
      .set('X-User-Password', 'userpass')
      .expect(401);
  });
});

describe('Account Request - DELETE /auth/account-request/:id', () => {
  it('should remove a request by id for an admin user', async () => {
    const createResp = await request(app.getHttpServer())
      .post('/auth/account-request')
      .send({
        email: 'toremove@example.com',
        name: 'To Remove',
        password: 'securepassword',
        userType: 'USER',
      })
      .expect(201);

    const id = createResp.body.id;

    const deleteResp = await request(app.getHttpServer())
      .delete(`/auth/account-request/${id}`)
      .set('X-User-Email', ADMIN_EMAIL)
      .set('X-User-Password', ADMIN_PASSWORD)
      .expect(200);

    expect(deleteResp.body.id).toBe(id);
    expect(deleteResp.body.email).toBe('toremove@example.com');

    const allResp = await request(app.getHttpServer())
      .get('/auth/account-request')
      .set('X-User-Email', ADMIN_EMAIL)
      .set('X-User-Password', ADMIN_PASSWORD)
      .expect(200);

    const ids = allResp.body.requests.map((r: any) => r.id);
    expect(ids).not.toContain(id);
  });

  it('should reject unauthenticated requests', () => {
    return request(app.getHttpServer())
      .delete('/auth/account-request/1')
      .expect(401);
  });

  it('should return 400 for non-numeric id', () => {
    return request(app.getHttpServer())
      .delete('/auth/account-request/abc')
      .set('X-User-Email', ADMIN_EMAIL)
      .set('X-User-Password', ADMIN_PASSWORD)
      .expect(400);
  });

  it('should return error for non-existent id', () => {
    return request(app.getHttpServer())
      .delete('/auth/account-request/999999')
      .set('X-User-Email', ADMIN_EMAIL)
      .set('X-User-Password', ADMIN_PASSWORD)
      .expect(404);
  });
});
