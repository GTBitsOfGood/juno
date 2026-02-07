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

  // Reset database
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

describe('Counter Routes', () => {
  it('Should successfully increment a counter', async () => {
    await request(app.getHttpServer())
      .post('/counter/api-test-counter-1/increment')
      .set('Authorization', 'Bearer ' + apiKey)
      .expect(200)
      .then((response) => {
        expect(response.body.id).toEqual('api-test-counter-1');
        expect(response.body.value).toEqual(1);
      });
  });

  it('Should successfully increment an existing counter', async () => {
    // First increment
    await request(app.getHttpServer())
      .post('/counter/api-test-counter-2/increment')
      .set('Authorization', 'Bearer ' + apiKey)
      .expect(200);

    // Second increment
    await request(app.getHttpServer())
      .post('/counter/api-test-counter-2/increment')
      .set('Authorization', 'Bearer ' + apiKey)
      .expect(200)
      .then((response) => {
        expect(response.body.id).toEqual('api-test-counter-2');
        expect(response.body.value).toEqual(2);
      });
  });

  it('Should successfully decrement a counter', async () => {
    await request(app.getHttpServer())
      .post('/counter/api-test-counter-3/decrement')
      .set('Authorization', 'Bearer ' + apiKey)
      .expect(200)
      .then((response) => {
        expect(response.body.id).toEqual('api-test-counter-3');
        expect(response.body.value).toEqual(-1);
      });
  });

  it('Should successfully decrement an existing counter', async () => {
    // First increment to create counter with value 1
    await request(app.getHttpServer())
      .post('/counter/api-test-counter-4/increment')
      .set('Authorization', 'Bearer ' + apiKey)
      .expect(200);

    // Decrement
    await request(app.getHttpServer())
      .post('/counter/api-test-counter-4/decrement')
      .set('Authorization', 'Bearer ' + apiKey)
      .expect(200)
      .then((response) => {
        expect(response.body.id).toEqual('api-test-counter-4');
        expect(response.body.value).toEqual(0);
      });
  });

  it('Should successfully reset a counter', async () => {
    // Create counter and increment twice
    await request(app.getHttpServer())
      .post('/counter/api-test-counter-5/increment')
      .set('Authorization', 'Bearer ' + apiKey)
      .expect(200);

    await request(app.getHttpServer())
      .post('/counter/api-test-counter-5/increment')
      .set('Authorization', 'Bearer ' + apiKey)
      .expect(200);

    // Reset
    await request(app.getHttpServer())
      .post('/counter/api-test-counter-5/reset')
      .set('Authorization', 'Bearer ' + apiKey)
      .expect(200)
      .then((response) => {
        expect(response.body.id).toEqual('api-test-counter-5');
        expect(response.body.value).toEqual(0);
      });
  });

  it('Should throw a 404 status error when resetting a non-existent counter', async () => {
    return await request(app.getHttpServer())
      .post('/counter/non-existent-counter/reset')
      .set('Authorization', 'Bearer ' + apiKey)
      .expect(404);
  });

  it('Should successfully get a counter', async () => {
    // Create counter
    await request(app.getHttpServer())
      .post('/counter/api-test-counter-6/increment')
      .set('Authorization', 'Bearer ' + apiKey)
      .expect(200);

    // Get counter
    await request(app.getHttpServer())
      .get('/counter/api-test-counter-6')
      .set('Authorization', 'Bearer ' + apiKey)
      .expect(200)
      .then((response) => {
        expect(response.body.id).toEqual('api-test-counter-6');
        expect(response.body.value).toEqual(1);
      });
  });

  it('Should throw a 404 status error when getting a non-existent counter', async () => {
    return await request(app.getHttpServer())
      .get('/counter/non-existent-counter-2')
      .set('Authorization', 'Bearer ' + apiKey)
      .expect(404);
  });

  it('Should throw a 401 status error when incrementing without auth', async () => {
    return await request(app.getHttpServer())
      .post('/counter/test-counter/increment')
      .expect(401);
  });

  it('Should throw a 401 status error when getting without auth', async () => {
    return await request(app.getHttpServer())
      .get('/counter/test-counter')
      .expect(401);
  });
});
