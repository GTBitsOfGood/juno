import { Test, TestingModule } from '@nestjs/testing';
import {
  ClassSerializerInterceptor,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { Reflector } from '@nestjs/core';
import * as GRPC from '@grpc/grpc-js';
import * as ProtoLoader from '@grpc/proto-loader';
import { ResetProtoFile } from 'juno-proto';
import { RpcExceptionFilter } from 'src/rpc_exception_filter';

let app: INestApplication;
const ADMIN_EMAIL = 'test-superadmin@test.com';
const ADMIN_PASSWORD = 'test-password';
let apiKey: string | undefined = undefined;

jest.setTimeout(10000);

async function createAPIKeyForProjectName(
  projectName: string,
): Promise<string> {
  const key = await request(app.getHttpServer())
    .post('/auth/key')
    .set('X-User-Email', ADMIN_EMAIL)
    .set('X-User-Password', ADMIN_PASSWORD)
    .send({
      environment: 'prod',
      project: {
        name: projectName,
      },
    });

  return key.body['apiKey'];
}

beforeAll(async () => {
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

  const proto = ProtoLoader.loadSync([ResetProtoFile]) as any;

  const protoGRPC = GRPC.loadPackageDefinition(proto) as any;
  const resetClient = new protoGRPC.juno.reset_db.DatabaseReset(
    process.env.DB_SERVICE_ADDR,
    GRPC.credentials.createInsecure(),
  );
  await new Promise((resolve, reject) => {
    resetClient.resetDb({}, (err: any) => {
      if (err) return reject(err);
      resolve(0);
    });
  });
});

afterAll(async () => {
  await app.close();
});

beforeEach(async () => {
  if (!apiKey) {
    apiKey = await createAPIKeyForProjectName('test-seed-project');
  }
});

describe('Feature Flag Routes (e2e)', () => {
  describe('POST /feature-flags', () => {
    it('Should successfully create a feature flag with valid credentials', async () => {
      return await request(app.getHttpServer())
        .post('/feature-flags')
        .set('Authorization', 'Bearer ' + apiKey)
        .send({
          id: 'feature-flag-1',
          enabled: true,
          description: 'feature flag 1 description',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', 'feature-flag-1');
          expect(res.body.enabled).toBe(true);
          expect(res.body.description).toBe('feature flag 1 description');
        });
    });

    it('Should throw a 400 status error when creating a flag with missing id', async () => {
      return await request(app.getHttpServer())
        .post('/feature-flags')
        .set('Authorization', 'Bearer ' + apiKey)
        .send({ enabled: true })
        .expect(400);
    });

    it('Should throw a 401 status error when creating a flag without valid credentials', async () => {
      return await request(app.getHttpServer())
        .post('/feature-flags')
        .send({ id: 'feature-flag-2', enabled: true })
        .expect(401);
    });
  });

  describe('GET /feature-flags/:id', () => {
    it('Should successfully get a feature flag with valid id and credentials', async () => {
      return await request(app.getHttpServer())
        .get('/feature-flags/feature-flag-1')
        .set('Authorization', 'Bearer ' + apiKey)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', 'feature-flag-1');
          expect(res.body.enabled).toBe(true);
        });
    });

    it('Should throw a 401 status error when fetching a flag without valid credentials', async () => {
      return await request(app.getHttpServer())
        .get('/feature-flags/feature-flag-1')
        .expect(401);
    });

    it('Should throw a 404 status error when fetching a nonexistent flag', async () => {
      return await request(app.getHttpServer())
        .get('/feature-flags/feature-flag-100')
        .set('Authorization', 'Bearer ' + apiKey)
        .expect(404);
    });
  });

  describe('PUT /feature-flags/:id', () => {
    it('Should successfully update a feature flag with valid data', async () => {
      return await request(app.getHttpServer())
        .put('/feature-flags/feature-flag-1')
        .set('Authorization', 'Bearer ' + apiKey)
        .send({ enabled: false })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', 'feature-flag-1');
          expect(res.body.enabled).toBe(false);
        });
    });

    it('Should throw a 401 status error when updating without valid credentials', async () => {
      return await request(app.getHttpServer())
        .put('/feature-flags/feature-flag-1')
        .send({ enabled: true })
        .expect(401);
    });

    it('Should throw a 404 status error when updating a nonexistent flag', async () => {
      return await request(app.getHttpServer())
        .put('/feature-flags/feature-flag-100')
        .set('Authorization', 'Bearer ' + apiKey)
        .send({ enabled: true })
        .expect(404);
    });
  });

  describe('DELETE /feature-flags/:id', () => {
    it('Should throw a 401 status error when deleting without valid credentials', async () => {
      return await request(app.getHttpServer())
        .delete('/feature-flags/feature-flag-1')
        .expect(401);
    });

    it('Should throw a 404 status error when deleting a nonexistent flag', async () => {
      return await request(app.getHttpServer())
        .delete('/feature-flags/feature-flag-100')
        .set('Authorization', 'Bearer ' + apiKey)
        .expect(404);
    });

    it('Should successfully delete a feature flag with valid id and credentials', async () => {
      return await request(app.getHttpServer())
        .delete('/feature-flags/feature-flag-1')
        .set('Authorization', 'Bearer ' + apiKey)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('success', true);
        });
    });
  });
});
