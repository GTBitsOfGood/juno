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

const ADMIN_EMAIL = 'test-superadmin@test.com';
const ADMIN_PASSWORD = 'test-password';

let app: INestApplication;
let apiKey: string | undefined = undefined;

jest.setTimeout(15000);

async function APIKeyForProjectName(projectName: string): Promise<string> {
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

afterAll(async () => {
  await app.close();
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

  if (!apiKey) {
    apiKey = await APIKeyForProjectName('test-seed-project');
  }
});

describe('Counter Routes', () => {
  it('gets the counter', async () => {
    await request(app.getHttpServer())
      .get('/counter/test-counter')
      .set('Authorization', 'Bearer ' + apiKey)
      .expect(200)
      .expect('{"id":"test-counter","value":0}');
  });

  it('increments the counter', async () => {
    await request(app.getHttpServer())
      .patch('/counter/test-counter/increment')
      .set('Authorization', 'Bearer ' + apiKey)
      .send({ value: 10 })
      .expect(200)
      .expect('{"id":"test-counter","value":10}');
  });

  it('decrements the counter', async () => {
    await request(app.getHttpServer())
      .patch('/counter/test-counter/decrement')
      .set('Authorization', 'Bearer ' + apiKey)
      .send({ value: 3 })
      .expect(200)
      .expect('{"id":"test-counter","value":7}');
  });

  it('resets the counter', async () => {
    await request(app.getHttpServer())
      .patch('/counter/test-counter/reset')
      .set('Authorization', 'Bearer ' + apiKey)
      .expect(200)
      .expect('{"id":"test-counter","value":0}');
  });
});
