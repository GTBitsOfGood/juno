import {
  ClassSerializerInterceptor,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { Reflector } from '@nestjs/core';
import * as GRPC from '@grpc/grpc-js';
import * as ProtoLoader from '@grpc/proto-loader';
import { ResetProtoFile } from 'juno-proto';
import { AppModule } from '../src/app.module';
import { RpcExceptionFilter } from 'src/rpc_exception_filter';

let app: INestApplication;
let apiKey: string;

const ADMIN_EMAIL = 'test-superadmin@test.com';
const ADMIN_PASSWORD = 'test-password';

jest.setTimeout(15000);

async function createApiKey(): Promise<string> {
  const response = await request(app.getHttpServer())
    .post('/auth/key')
    .set('X-User-Email', ADMIN_EMAIL)
    .set('X-User-Password', ADMIN_PASSWORD)
    .send({
      environment: 'prod',
      project: { name: 'test-seed-project' },
    });

  return response.body.apiKey;
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
  const protoGrpc = GRPC.loadPackageDefinition(proto) as any;
  const resetClient = new protoGrpc.juno.reset_db.DatabaseReset(
    process.env.DB_SERVICE_ADDR,
    GRPC.credentials.createInsecure(),
  );

  await new Promise<void>((resolve, reject) => {
    resetClient.resetDb({}, (error: Error | null) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
});

beforeEach(async () => {
  if (!apiKey) {
    apiKey = await createApiKey();
  }
});

afterAll(async () => {
  await app.close();
});

describe('Feature Flag Routes (e2e)', () => {
  it('creates and retrieves a feature flag', async () => {
    await request(app.getHttpServer())
      .post('/feature_flag')
      .set('Authorization', `Bearer ${apiKey}`)
      .send({
        id: 'new-flag',
        enabled: false,
        description: 'temp',
      })
      .expect(201)
      .expect((response) => {
        expect(response.body).toEqual({
          id: 'new-flag',
          enabled: false,
          description: 'temp',
        });
      });

    await request(app.getHttpServer())
      .get('/feature_flag/new-flag')
      .set('Authorization', `Bearer ${apiKey}`)
      .expect(200)
      .expect((response) => {
        expect(response.body).toEqual({
          id: 'new-flag',
          enabled: false,
          description: 'temp',
        });
      });
  });

  it('rejects an invalid create request', async () => {
    await request(app.getHttpServer())
      .post('/feature_flag')
      .set('Authorization', `Bearer ${apiKey}`)
      .send({ enabled: true })
      .expect(400);
  });

  it('updates only the fields supplied', async () => {
    await request(app.getHttpServer())
      .post('/feature_flag')
      .set('Authorization', `Bearer ${apiKey}`)
      .send({
        id: 'updated-flag',
        enabled: false,
        description: 'original',
      })
      .expect(201);

    await request(app.getHttpServer())
      .put('/feature_flag/updated-flag')
      .set('Authorization', `Bearer ${apiKey}`)
      .send({ enabled: true })
      .expect(200)
      .expect((response) => {
        expect(response.body).toEqual({
          id: 'updated-flag',
          enabled: true,
          description: 'original',
        });
      });
  });

  it('deletes a feature flag and returns not found afterward', async () => {
    await request(app.getHttpServer())
      .post('/feature_flag')
      .set('Authorization', `Bearer ${apiKey}`)
      .send({
        id: 'deleted-flag',
        enabled: true,
        description: 'temp',
      })
      .expect(201);

    await request(app.getHttpServer())
      .delete('/feature_flag/deleted-flag')
      .set('Authorization', `Bearer ${apiKey}`)
      .expect(200);

    await request(app.getHttpServer())
      .get('/feature_flag/deleted-flag')
      .set('Authorization', `Bearer ${apiKey}`)
      .expect(404);
  });
});
