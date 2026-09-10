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
import { RpcExceptionFilter } from 'src/rpc_exception_filter';

let app: INestApplication;
const ADMIN_EMAIL = 'test-superadmin@test.com';
const ADMIN_PASSWORD = 'test-password';

let apiKey: string;
jest.setTimeout(15000);

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

async function createApiKey(proj: string, env: string): Promise<string> {
  const key = await request(app.getHttpServer())
    .post('/auth/key')
    .set('X-User-Email', ADMIN_EMAIL)
    .set('X-User-Password', ADMIN_PASSWORD)
    .send({
      environment: env,
      project: {
        name: proj,
      },
    });

  return key.body['apiKey'];
}

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

  if (!apiKey) {
    apiKey = await createApiKey('test-seed-project', 'prod');
  }
});

describe('Feature Flag Creation Routes', () => {
  it('Creates a new feature flag with required fields', async () => {
    await request(app.getHttpServer())
      .post('/feature-flag/create')
      .set('Authorization', 'Bearer ' + apiKey)
      .send({
        id: 'new-ui-dashboard',
        enabled: false,
      })
      .expect(201);
  });

  it('Creates a new feature flag with all fields', async () => {
    await request(app.getHttpServer())
      .post('/feature-flag/create')
      .set('Authorization', 'Bearer ' + apiKey)
      .send({
        id: 'beta-feature-x',
        enabled: true,
        description: 'Enables the beta feature X for testing',
      })
      .expect(201);
  });

  it('Fails without an id', async () => {
    return request(app.getHttpServer())
      .post('/feature-flag/create')
      .set('Authorization', 'Bearer ' + apiKey)
      .send({
        enabled: true,
      })
      .expect(400);
  });

  it('Fails when called without an API Key', () => {
    return request(app.getHttpServer())
      .post('/feature-flag/create')
      .send({
        id: 'test-flag',
        enabled: true,
      })
      .expect(401);
  });
});

describe('Feature Flag Retrieval Routes', () => {
  it('Successfully gets a feature flag by id', async () => {
    const flagId = 'retrieval-test-flag';
    await request(app.getHttpServer())
      .post('/feature-flag/create')
      .set('Authorization', 'Bearer ' + apiKey)
      .send({ id: flagId, enabled: true });

    await request(app.getHttpServer())
      .get(`/feature-flag/${flagId}`)
      .set('Authorization', 'Bearer ' + apiKey)
      .expect(200);
  });

  it('Failed to get feature flag due to not found id', async () => {
    return await request(app.getHttpServer())
      .get('/feature-flag/nonexistent-flag-id')
      .set('Authorization', 'Bearer ' + apiKey)
      .expect(404);
  });

  it('Failed to get feature flag due to missing api key', async () => {
    return await request(app.getHttpServer())
      .get('/feature-flag/some-flag-id')
      .expect(401);
  });
});

describe('Feature Flag Update Routes', () => {
  it('Updates a feature flag with valid parameters', async () => {
    const flagId = 'update-test-flag';
    await request(app.getHttpServer())
      .post('/feature-flag/create')
      .set('Authorization', 'Bearer ' + apiKey)
      .send({ id: flagId, enabled: false });

    return request(app.getHttpServer())
      .patch(`/feature-flag/${flagId}`)
      .set('Authorization', 'Bearer ' + apiKey)
      .send({
        enabled: true,
        description: 'Updated description',
      })
      .expect(200);
  });

  it('Failed to update feature flag due to not found id', async () => {
    return request(app.getHttpServer())
      .patch('/feature-flag/nonexistent-flag-id')
      .set('Authorization', 'Bearer ' + apiKey)
      .send({
        enabled: true,
      })
      .expect(404);
  });

  it('Update endpoint called with no Authorization header', async () => {
    return request(app.getHttpServer())
      .patch('/feature-flag/some-flag-id')
      .send({
        enabled: true,
      })
      .expect(401);
  });
});

describe('Feature Flag Deletion Routes', () => {
  it('Successfully deletes an existing feature flag', async () => {
    const flagId = 'delete-test-flag';
    await request(app.getHttpServer())
      .post('/feature-flag/create')
      .set('Authorization', 'Bearer ' + apiKey)
      .send({ id: flagId, enabled: false });

    return request(app.getHttpServer())
      .delete(`/feature-flag/${flagId}`)
      .set('Authorization', 'Bearer ' + apiKey)
      .expect(200);
  });

  it('Failed to delete feature flag due to not found id', async () => {
    return request(app.getHttpServer())
      .delete('/feature-flag/nonexistent-flag-id')
      .set('Authorization', 'Bearer ' + apiKey)
      .expect(404);
  });
});
