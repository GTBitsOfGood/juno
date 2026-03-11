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

describe('List API Keys - GET /auth/key/:projectId', () => {
  it('should list API keys for a project as a superadmin', async () => {
    // First create an API key for the project
    const createResp = await request(app.getHttpServer())
      .post('/auth/key')
      .set('X-User-Email', ADMIN_EMAIL)
      .set('X-User-Password', ADMIN_PASSWORD)
      .send({
        environment: 'prod',
        project: { name: 'test-seed-project' },
        description: 'list-test-key',
      })
      .expect(201);

    expect(createResp.body.apiKey).toBeDefined();

    // Get the project ID (seed project has id 0)
    const response = await request(app.getHttpServer())
      .get('/auth/key/all?projectId=0')
      .set('X-User-Email', ADMIN_EMAIL)
      .set('X-User-Password', ADMIN_PASSWORD)
      .expect(200);

    expect(response.body.keys).toBeDefined();
    expect(Array.isArray(response.body.keys)).toBe(true);
    expect(response.body.keys.length).toBeGreaterThanOrEqual(1);
  });

  it('should return an empty list for a project with no API keys', async () => {
    // Create a new project via the project endpoint
    const projectResp = await request(app.getHttpServer())
      .post('/project')
      .set('X-User-Email', ADMIN_EMAIL)
      .set('X-User-Password', ADMIN_PASSWORD)
      .send({ name: 'empty-key-project' })
      .expect(201);

    const projectId = projectResp.body.id;

    const response = await request(app.getHttpServer())
      .get(`/auth/key/all?projectId=${projectId}`)
      .set('X-User-Email', ADMIN_EMAIL)
      .set('X-User-Password', ADMIN_PASSWORD)
      .expect(200);

    expect(response.body.keys).toBeDefined();
    expect(response.body.keys).toEqual([]);
  });

  it('should reject unauthenticated requests', () => {
    return request(app.getHttpServer()).get('/auth/key/0').expect(401);
  });

  it('should reject a regular USER who is not linked to the project', async () => {
    // Create a regular user
    await request(app.getHttpServer())
      .post('/user')
      .set('X-User-Email', ADMIN_EMAIL)
      .set('X-User-Password', ADMIN_PASSWORD)
      .send({
        email: 'regularuser-listkeys@example.com',
        password: 'userpass',
        name: 'Regular User',
      })
      .expect(201);

    return request(app.getHttpServer())
      .get('/auth/key/all?projectId=0')
      .set('X-User-Email', 'regularuser-listkeys@example.com')
      .set('X-User-Password', 'userpass')
      .expect(401);
  });

  it('should allow a linked ADMIN to list API keys for their project', async () => {
    // Create a project
    const projectResp = await request(app.getHttpServer())
      .post('/project')
      .set('X-User-Email', ADMIN_EMAIL)
      .set('X-User-Password', ADMIN_PASSWORD)
      .send({ name: 'admin-linked-project' })
      .expect(201);

    const projectId = projectResp.body.id;

    // Create a user (defaults to USER type)
    const userResp = await request(app.getHttpServer())
      .post('/user')
      .set('X-User-Email', ADMIN_EMAIL)
      .set('X-User-Password', ADMIN_PASSWORD)
      .send({
        email: 'linked-admin@example.com',
        password: 'adminpass',
        name: 'Linked Admin',
      })
      .expect(201);

    const userId = userResp.body.id;

    // Promote user to ADMIN
    await request(app.getHttpServer())
      .post('/user/type')
      .set('X-User-Email', ADMIN_EMAIL)
      .set('X-User-Password', ADMIN_PASSWORD)
      .send({
        id: userId,
        type: 'ADMIN',
      })
      .expect(201);

    // Link the admin to the project
    await request(app.getHttpServer())
      .put(`/user/id/${userId}/project`)
      .set('X-User-Email', ADMIN_EMAIL)
      .set('X-User-Password', ADMIN_PASSWORD)
      .send({ name: 'admin-linked-project' })
      .expect(200);

    // Create an API key for the project
    await request(app.getHttpServer())
      .post('/auth/key')
      .set('X-User-Email', ADMIN_EMAIL)
      .set('X-User-Password', ADMIN_PASSWORD)
      .send({
        environment: 'prod',
        project: { id: projectId },
        description: 'admin-linked-key',
      })
      .expect(201);

    // The linked admin should be able to list keys
    const response = await request(app.getHttpServer())
      .get(`/auth/key/all?projectId=${projectId}`)
      .set('X-User-Email', 'linked-admin@example.com')
      .set('X-User-Password', 'adminpass')
      .expect(200);

    expect(response.body.keys).toBeDefined();
    expect(Array.isArray(response.body.keys)).toBe(true);
    expect(response.body.keys.length).toBeGreaterThanOrEqual(1);
  });

  it('should reject an ADMIN who is not linked to the project', async () => {
    // Create a user and promote to ADMIN but do NOT link to the seed project
    const userResp = await request(app.getHttpServer())
      .post('/user')
      .set('X-User-Email', ADMIN_EMAIL)
      .set('X-User-Password', ADMIN_PASSWORD)
      .send({
        email: 'unlinked-admin@example.com',
        password: 'adminpass',
        name: 'Unlinked Admin',
      })
      .expect(201);

    await request(app.getHttpServer())
      .post('/user/type')
      .set('X-User-Email', ADMIN_EMAIL)
      .set('X-User-Password', ADMIN_PASSWORD)
      .send({
        id: userResp.body.id,
        type: 'ADMIN',
      })
      .expect(201);

    return request(app.getHttpServer())
      .get('/auth/key/all?projectId=0')
      .set('X-User-Email', 'unlinked-admin@example.com')
      .set('X-User-Password', 'adminpass')
      .expect(401);
  });

  it('should support offset and limit query parameters', async () => {
    // Create multiple API keys
    for (let i = 0; i < 3; i++) {
      await request(app.getHttpServer())
        .post('/auth/key')
        .set('X-User-Email', ADMIN_EMAIL)
        .set('X-User-Password', ADMIN_PASSWORD)
        .send({
          environment: 'prod',
          project: { name: 'test-seed-project' },
          description: `pagination-key-${i}`,
        })
        .expect(201);
    }

    const response = await request(app.getHttpServer())
      .get('/auth/key/all?offset=0&limit=2&projectId=0')
      .set('X-User-Email', ADMIN_EMAIL)
      .set('X-User-Password', ADMIN_PASSWORD)
      .expect(200);

    expect(response.body.keys).toBeDefined();
    expect(response.body.keys.length).toBeLessThanOrEqual(2);
  });
});

describe('Delete API Key by ID - DELETE /auth/key/:id', () => {
  it('should delete an existing API key by its ID', async () => {
    // Create an API key
    const createResp = await request(app.getHttpServer())
      .post('/auth/key')
      .set('X-User-Email', ADMIN_EMAIL)
      .set('X-User-Password', ADMIN_PASSWORD)
      .send({
        environment: 'prod',
        project: { name: 'test-seed-project' },
        description: 'delete-by-id-test',
      })
      .expect(201);

    expect(createResp.body.apiKey).toBeDefined();

    // List keys to find the created key's ID
    const listResp = await request(app.getHttpServer())
      .get('/auth/key/all?projectId=0')
      .set('X-User-Email', ADMIN_EMAIL)
      .set('X-User-Password', ADMIN_PASSWORD)
      .expect(200);

    const createdKey = listResp.body.keys.find(
      (k: any) => k.description === 'delete-by-id-test',
    );
    expect(createdKey).toBeDefined();
    const keyId = createdKey.id;

    // Delete the key by ID
    await request(app.getHttpServer())
      .delete(`/auth/key/${keyId}`)
      .set('X-User-Email', ADMIN_EMAIL)
      .set('X-User-Password', ADMIN_PASSWORD)
      .expect(200);
  });

  it('should return 400 for a non-numeric ID', () => {
    return request(app.getHttpServer())
      .delete('/auth/key/abc')
      .set('X-User-Email', ADMIN_EMAIL)
      .set('X-User-Password', ADMIN_PASSWORD)
      .expect(400);
  });

  it('should return an error for a non-existent API key ID', () => {
    return request(app.getHttpServer())
      .delete('/auth/key/999999')
      .set('X-User-Email', ADMIN_EMAIL)
      .set('X-User-Password', ADMIN_PASSWORD)
      .expect(500);
  });

  it('should not be accessible without authentication', () => {
    return request(app.getHttpServer()).delete('/auth/key/1').expect(401);
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
