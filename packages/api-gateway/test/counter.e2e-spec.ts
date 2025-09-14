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

describe('Counter Routes', () => {
  it('increment counter (POST)', () => {
    return request(app.getHttpServer())
      .post('/counter/counter/increment')
      .send({
        counterId: 'test-counter-1',
        amount: 5,
      })
      .expect(201)
      .expect((res) => {
        expect(res.body).toHaveProperty('counterId', 'test-counter-1');
        expect(res.body).toHaveProperty('value', 5);
      });
  });

  it('decrement counter (POST)', async () => {
    // First increment to have a value to decrement
    await request(app.getHttpServer()).post('/counter/counter/increment').send({
      counterId: 'test-counter-2',
      amount: 10,
    });

    return request(app.getHttpServer())
      .post('/counter/counter/decrement')
      .send({
        counterId: 'test-counter-2',
        amount: 3,
      })
      .expect(201)
      .expect((res) => {
        expect(res.body).toHaveProperty('counterId', 'test-counter-2');
        expect(res.body).toHaveProperty('value', 7);
      });
  });

  it('get counter value (GET)', async () => {
    // First set a counter value
    await request(app.getHttpServer()).post('/counter/counter/increment').send({
      counterId: 'test-counter-3',
      amount: 42,
    });

    return request(app.getHttpServer())
      .get('/counter/counter/get?id=test-counter-3')
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('counterId', 'test-counter-3');
        expect(res.body).toHaveProperty('value', 42);
      });
  });

  it('reset counter to zero (POST)', async () => {
    // First set a counter value
    await request(app.getHttpServer()).post('/counter/counter/increment').send({
      counterId: 'test-counter-4',
      amount: 100,
    });

    return request(app.getHttpServer())
      .post('/counter/counter/reset')
      .send({ id: 'test-counter-4' })
      .expect(201)
      .expect((res) => {
        expect(res.body).toHaveProperty('counterId', 'test-counter-4');
        expect(res.body).toHaveProperty('value', 0);
      });
  });

  it('get non-existent counter returns 0', () => {
    return request(app.getHttpServer())
      .get('/counter/counter/get?id=nonexistent-counter')
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('counterId', 'nonexistent-counter');
        expect(res.body).toHaveProperty('value', 0);
      });
  });
});
