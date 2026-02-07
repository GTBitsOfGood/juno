import { Test, TestingModule } from '@nestjs/testing';
import {
  ClassSerializerInterceptor,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import * as request from 'supertest';
import * as GRPC from '@grpc/grpc-js';
import * as ProtoLoader from '@grpc/proto-loader';
import { ResetProtoFile } from 'juno-proto';
import { AppModule } from './../src/app.module';
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

describe('Counter Routes (e2e)', () => {
  describe('POST /counter', () => {
    it('Should successfully create a counter', async () => {
      return await request(app.getHttpServer())
        .post('/counter')
        .send({ id: 'test-counter', initialValue: 10 })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('value', 10);
        });
    });

    it('Should create a counter with default value of 0', async () => {
      return await request(app.getHttpServer())
        .post('/counter')
        .send({ id: 'test-counter-default' })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('value', 0);
        });
    });

    it('Should return 409 when creating a duplicate counter', async () => {
      await request(app.getHttpServer())
        .post('/counter')
        .send({ id: 'test-counter-dup', initialValue: 0 });

      return await request(app.getHttpServer())
        .post('/counter')
        .send({ id: 'test-counter-dup', initialValue: 5 })
        .expect(409);
    });
  });

  describe('GET /counter/:id', () => {
    it('Should successfully get a counter value', async () => {
      await request(app.getHttpServer())
        .post('/counter')
        .send({ id: 'test-get-counter', initialValue: 42 });

      return await request(app.getHttpServer())
        .get('/counter/test-get-counter')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('value', 42);
        });
    });

    it('Should return 404 for a nonexistent counter', async () => {
      return await request(app.getHttpServer())
        .get('/counter/nonexistent')
        .expect(404);
    });
  });

  describe('POST /counter/:id/increment', () => {
    it('Should increment a counter', async () => {
      await request(app.getHttpServer())
        .post('/counter')
        .send({ id: 'test-inc', initialValue: 0 });

      return await request(app.getHttpServer())
        .post('/counter/test-inc/increment')
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('value', 1);
        });
    });
  });

  describe('POST /counter/:id/decrement', () => {
    it('Should decrement a counter', async () => {
      await request(app.getHttpServer())
        .post('/counter')
        .send({ id: 'test-dec', initialValue: 5 });

      return await request(app.getHttpServer())
        .post('/counter/test-dec/decrement')
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('value', 4);
        });
    });
  });

  describe('POST /counter/:id/reset', () => {
    it('Should reset a counter to zero', async () => {
      await request(app.getHttpServer())
        .post('/counter')
        .send({ id: 'test-reset', initialValue: 99 });

      return await request(app.getHttpServer())
        .post('/counter/test-reset/reset')
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('value', 0);
        });
    });
  });
});
