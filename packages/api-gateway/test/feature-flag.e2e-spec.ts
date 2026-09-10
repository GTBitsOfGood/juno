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

describe('Feature Flag Retrieval Routes', () => {
  it('Successfully get a feature flag ', async () => {
    // Seed a flag first so we have a valid ID to retrieve
    const seed = await request(app.getHttpServer())
      .post('/feature-flag/create')
      .set('Authorization', 'Bearer ' + apiKey)
      .send({ name: 'retrieval-test', isEnabled: true });

    await request(app.getHttpServer())
      .get(`/feature-flag/${seed.body.id}`)
      .set('Authorization', 'Bearer ' + apiKey)
      .expect(200);
  });

  it('Failed to get feature flag due to invalid id', async () => {
    return await request(app.getHttpServer())
      .get('/feature-flag/invalid-id')
      .set('Authorization', 'Bearer ' + apiKey)
      .expect(400);
  });

  it('Failed to get feature flag due to missing api key', async () => {
    return await request(app.getHttpServer())
      .get('/feature-flag/0')
      .expect(401);
  });

  it('Failed to get feature flag due to not found id', async () => {
    return await request(app.getHttpServer())
      .get('/feature-flag/99999999')
      .set('Authorization', 'Bearer ' + apiKey)
      .expect(404);
  });
});

describe('Feature Flag Creation Routes', () => {
  it('Creates a new feature flag for a different env', async () => {
    const localApiKey = await createApiKey('test-seed-project', 'dev');
    
    await request(app.getHttpServer())
      .post('/feature-flag/create')
      .set('Authorization', 'Bearer ' + localApiKey)
      .send({
        name: 'new-ui-dashboard',
        isEnabled: false,
      })
      .expect(201);
  });

  it('Fails without a name', async () => {
    return request(app.getHttpServer())
      .post('/feature-flag/create')
      .set('Authorization', 'Bearer ' + apiKey)
      .send({
        isEnabled: true,
      })
      .expect(400);
  });

  it('Creation endpoint called with no Authorization header', () => {
    return request(app.getHttpServer())
      .post('/feature-flag/create')
      .send({
        name: 'test-flag',
        isEnabled: true,
      })
      .expect(401);
  });

  it('Creation endpoint called with an invalid API Key', () => {
    return request(app.getHttpServer())
      .post('/feature-flag/create')
      .set('Authorization', 'Bearer invalid.api.key')
      .send({
        name: 'test-flag',
        isEnabled: true,
      })
      .expect(401);
  });
  
  it('Creation endpoint called with a correct payload (header + body)', () => {
    return request(app.getHttpServer())
      .post('/feature-flag/create')
      .set('Authorization', 'Bearer ' + apiKey)
      .send({
        name: 'correct-payload-flag',
        isEnabled: true,
        description: 'Testing correct payload creation',
      })
      .expect(201); 
  });
});

describe('Feature Flag Update Routes', () => {
  it('Updates a feature flag with valid parameters', async () => {
    const seed = await request(app.getHttpServer())
      .post('/feature-flag/create')
      .set('Authorization', 'Bearer ' + apiKey)
      .send({ name: 'update-test-flag', isEnabled: false });

    return request(app.getHttpServer())
      .patch(`/feature-flag/${seed.body.id}`)
      .set('Authorization', 'Bearer ' + apiKey)
      .send({
        isEnabled: true,
      })
      .expect(200);
  });

  it('Update endpoint called with no Authorization header', async () => {
    return request(app.getHttpServer())
      .patch('/feature-flag/0')
      .send({
        isEnabled: true,
      })
      .expect(401);
  });

  it('Update endpoint called with an invalid API Key', async () => {
    return request(app.getHttpServer())
      .patch('/feature-flag/0')
      .set('Authorization', 'Bearer invalid.jwt.token')
      .send({
        isEnabled: true,
      })
      .expect(401);
  });

  it('Failed to update feature flag due to not found id', async () => {
    return request(app.getHttpServer())
      .patch('/feature-flag/99999999')
      .set('Authorization', 'Bearer ' + apiKey)
      .send({
        isEnabled: true,
      })
      .expect(404);
  });
});
