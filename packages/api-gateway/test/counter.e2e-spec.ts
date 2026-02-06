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
let apiKey: string | undefined = undefined;

jest.setTimeout(15000);

const ADMIN_EMAIL = 'test-superadmin@test.com';
const ADMIN_PASSWORD = 'test-password';
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

  if (!apiKey) {
    apiKey = await APIKeyForProjectName('test-seed-project');
  }
});

describe('Counter CRUD routes', () => {
  it('Increments the value for a counter and decrements the value for the same counter', async () => {
    const respInc = await request(app.getHttpServer())
      .patch('/counter/1/increment')
      .set('Authorization', 'Bearer ' + apiKey)
      .send({})
      .expect(200);
    expect(respInc.body).toEqual({ id: '1', value: 1 });
    const respDec = await request(app.getHttpServer())
      .patch('/counter/1/decrement')
      .set('Authorization', 'Bearer ' + apiKey)
      .send({})
      .expect(200);
    expect(respDec.body).toEqual({ id: '1', value: 0 });
  });

  it('Gets a counter value, increments it, and resets it back to zero', async () => {
    const respGet = await request(app.getHttpServer())
      .get('/counter/2')
      .set('Authorization', 'Bearer ' + apiKey)
      .expect(200);
    expect(respGet.body).toEqual({ id: '2', value: 0 });

    await request(app.getHttpServer())
      .patch('/counter/2/increment')
      .set('Authorization', 'Bearer ' + apiKey)
      .send({})
      .expect(200);

    const respGetAfterInc = await request(app.getHttpServer())
      .get('/counter/2')
      .set('Authorization', 'Bearer ' + apiKey)
      .expect(200);
    expect(respGetAfterInc.body).toEqual({ id: '2', value: 1 });

    const respReset = await request(app.getHttpServer())
      .delete('/counter/2')
      .set('Authorization', 'Bearer ' + apiKey)
      .expect(200);
    expect(respReset.body).toEqual({ id: '2', value: 0 });
  });
});
