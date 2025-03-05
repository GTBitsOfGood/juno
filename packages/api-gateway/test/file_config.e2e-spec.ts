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

describe('File Config Routes', () => {
  it('Should successfully get a file config given a valid project ID and credentials', async () => {
    await request(app.getHttpServer())
      .get('/file/config/0')
      .set('Authorization', 'Bearer ' + apiKey)
      .expect(200);
  });

  it('Should throw a 400 status error when fetching a config via invalid ID', async () => {
    return await request(app.getHttpServer())
      .get('/file/config/invalid-id')
      .set('Authorization', 'Bearer ' + apiKey)
      .expect(400);
  });

  it('Should throw a 401 status error when fetching a config without valid credentials', async () => {
    return await request(app.getHttpServer()).get('/file/config/0').expect(401);
  });

  it('Should throw a 404 status error when fetching a config with a non-existent project ID', async () => {
    return await request(app.getHttpServer())
      .get('/file/config/1')
      .set('Authorization', 'Bearer ' + apiKey)
      .expect(404);
  });
});
