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

describe('Analytics Config Routes (e2e)', () => {
  describe('POST /analytics/config', () => {
    it('Should successfully create an analytics config with valid credentials', async () => {
      return await request(app.getHttpServer())
        .post('/analytics/config')
        .set('Authorization', 'Bearer ' + apiKey)
        .send({
          analyticsKey: 'test-analytics-key-123',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('environment');
          expect(res.body).toHaveProperty('analyticsKey');
          expect(res.body.analyticsKey).toBe('test-analytics-key-123');
        });
    });

    it('Should throw a 400 status error when creating config with missing analyticsKey', async () => {
      return await request(app.getHttpServer())
        .post('/analytics/config')
        .set('Authorization', 'Bearer ' + apiKey)
        .send({})
        .expect(400);
    });

    it('Should throw a 401 status error when creating config without valid credentials', async () => {
      return await request(app.getHttpServer())
        .post('/analytics/config')
        .send({
          analyticsKey: 'test-analytics-key-123',
        })
        .expect(401);
    });

    it('Should throw a 409 status error when creating duplicate analytics config', async () => {
      // First, ensure there's already a config for this project
      await request(app.getHttpServer())
        .post('/analytics/config')
        .set('Authorization', 'Bearer ' + apiKey)
        .send({
          analyticsKey: 'duplicate-test-key',
        })
        .expect(201);

      // Now try to create another config for the same project - should fail with 409
      return await request(app.getHttpServer())
        .post('/analytics/config')
        .set('Authorization', 'Bearer ' + apiKey)
        .send({
          analyticsKey: 'duplicate-test-key-2',
        })
        .expect(409);
    });
  });

  describe('GET /analytics/config/:projectId', () => {
    it('Should successfully get an analytics config with valid project ID and credentials', async () => {
      return await request(app.getHttpServer())
        .get('/analytics/config/0')
        .set('Authorization', 'Bearer ' + apiKey)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', 0);
          expect(res.body).toHaveProperty('environment');
          expect(res.body).toHaveProperty('analyticsKey', 'test-analytics-key-123');
        });
    });

    it('Should throw a 400 status error when fetching config via invalid project ID', async () => {
      return await request(app.getHttpServer())
        .get('/analytics/config/invalid-id')
        .set('Authorization', 'Bearer ' + apiKey)
        .expect(400);
    });

    it('Should throw a 401 status error when fetching config without valid credentials', async () => {
      return await request(app.getHttpServer())
        .get('/analytics/config/0')
        .expect(401);
    });

    it('Should throw a 404 status error when trying to access non-existent project config', async () => {
      return await request(app.getHttpServer())
        .get('/analytics/config/999')
        .set('Authorization', 'Bearer ' + apiKey)
        .expect(404);
    });
  });

  describe('PUT /analytics/config/:projectId', () => {
    it('Should successfully update an analytics config with valid data', async () => {
      return await request(app.getHttpServer())
        .put('/analytics/config/0')
        .set('Authorization', 'Bearer ' + apiKey)
        .send({
          analyticsKey: 'updated-analytics-key',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', 0);
          expect(res.body).toHaveProperty(
            'analyticsKey',
            'updated-analytics-key',
          );
        });
    });

    it('Should throw a 400 status error when updating with invalid project ID', async () => {
      return await request(app.getHttpServer())
        .put('/analytics/config/invalid-id')
        .set('Authorization', 'Bearer ' + apiKey)
        .send({
          analyticsKey: 'updated-key',
        })
        .expect(400);
    });

    it('Should throw a 401 status error when updating without valid credentials', async () => {
      return await request(app.getHttpServer())
        .put('/analytics/config/0')
        .send({
          analyticsKey: 'updated-key',
        })
        .expect(401);
    });

    it('Should throw a 404 status error when trying to update non-existent project config', async () => {
      return await request(app.getHttpServer())
        .put('/analytics/config/999')
        .set('Authorization', 'Bearer ' + apiKey)
        .send({
          analyticsKey: 'updated-key',
        })
        .expect(404);
    });
  });

  describe('DELETE /analytics/config/:projectId', () => {
    it('Should successfully delete an analytics config with valid project ID and credentials', async () => {
      return await request(app.getHttpServer())
        .delete('/analytics/config/0')
        .set('Authorization', 'Bearer ' + apiKey)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', 0);
          expect(res.body).toHaveProperty('analyticsKey', 'updated-analytics-key');
        });
    });

    it('Should throw a 400 status error when deleting with invalid project ID', async () => {
      return await request(app.getHttpServer())
        .delete('/analytics/config/invalid-id')
        .set('Authorization', 'Bearer ' + apiKey)
        .expect(400);
    });

    it('Should throw a 401 status error when deleting without valid credentials', async () => {
      return await request(app.getHttpServer())
        .delete('/analytics/config/0')
        .expect(401);
    });

    it('Should throw a 404 status error when trying to delete non-existent project config', async () => {
      return await request(app.getHttpServer())
        .delete('/analytics/config/999')
        .set('Authorization', 'Bearer ' + apiKey)
        .expect(404);
    });

    it('Should throw a 404 status error when deleting already deleted config', async () => {
      await request(app.getHttpServer())
        .delete('/analytics/config/0')
        .set('Authorization', 'Bearer ' + apiKey)
        .expect(200);

      return await request(app.getHttpServer())
        .delete('/analytics/config/0')
        .set('Authorization', 'Bearer ' + apiKey)
        .expect(404);
    });
  });
});
