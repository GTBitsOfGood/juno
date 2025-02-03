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

const ADMIN_EMAIL = 'test-superadmin@test.com';
const ADMIN_PASSWORD = 'test-password';

describe('Counter Routes', () => {
  it('Get and create a counter', () => {
    return request(app.getHttpServer())
      .get('/counter/counter_first')
      .set('X-User-Email', ADMIN_EMAIL)
      .set('X-User-Password', ADMIN_PASSWORD)
      .send()
      .expect(200)
      .then((response) => {
        expect(response.body.value).toEqual(0);
      });
  });
  it('Increment aforementioned counter', () => {
    return request(app.getHttpServer())
      .patch('/counter/increment/counter_first')
      .set('X-User-Email', ADMIN_EMAIL)
      .set('X-User-Password', ADMIN_PASSWORD)
      .send()
      .expect(200)
      .then((response) => {
        expect(response.body.value).toEqual(1);
      });
  });
  it('Increment aforementioned counter again', () => {
    return request(app.getHttpServer())
      .patch('/counter/increment/counter_first')
      .set('X-User-Email', ADMIN_EMAIL)
      .set('X-User-Password', ADMIN_PASSWORD)
      .send()
      .expect(200)
      .then((response) => {
        expect(response.body.value).toEqual(2);
      });
  });
  it('Decrement aforementioned counter', () => {
    return request(app.getHttpServer())
      .patch('/counter/decrement/counter_first')
      .set('X-User-Email', ADMIN_EMAIL)
      .set('X-User-Password', ADMIN_PASSWORD)
      .send()
      .expect(200)
      .then((response) => {
        expect(response.body.value).toEqual(1);
      });
  });
  it('Reset counter', async () => {
    const response = await request(app.getHttpServer())
      .delete('/counter/counter_first')
      .set('X-User-Email', ADMIN_EMAIL)
      .set('X-User-Password', ADMIN_PASSWORD)
      .send()
      .expect(200);
    console.log('HERE');
    console.log(response);
    expect(response.body.value).toEqual(0);
  });
});
