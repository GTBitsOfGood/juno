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
let counterId: string;

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

  // Create a new counter for testing and store the generated ID
  const response = await request(app.getHttpServer())
    .post('/counter/0')
    .send()
    .expect(201);

  counterId = response.body.counterId; // Store generated ID
  expect(counterId).toBeDefined();
});

describe('Counter API Tests', () => {
  it('creates a new counter', async () => {
    const response = await request(app.getHttpServer())
      .post('/counter/0')
      .send()
      .expect(201);

    expect(response.body).toHaveProperty('counterId');
    expect(response.body.value).toBe(0);
  });

  it('retrieves the newly created counter', async () => {
    const response = await request(app.getHttpServer())
      .get(`/counter/${counterId}`)
      .send()
      .expect(200);

    expect(response.body.value).toBe(0);
  });

  it('increments the counter correctly', async () => {
    const response = await request(app.getHttpServer())
      .put(`/counter/increment/${counterId}`)
      .send()
      .expect(200);

    expect(response.body.value).toBe(1);
  });

  it('decrements the counter correctly', async () => {
    await request(app.getHttpServer()).put(`/counter/increment/${counterId}`);

    const response = await request(app.getHttpServer())
      .put(`/counter/decrement/${counterId}`)
      .send()
      .expect(200);

    expect(response.body.value).toBe(0);
  });

  it('resets the counter to zero', async () => {
    await request(app.getHttpServer()).put(`/counter/increment/${counterId}`);
    await request(app.getHttpServer()).put(`/counter/increment/${counterId}`);

    const response = await request(app.getHttpServer())
      .put(`/counter/reset/${counterId}`)
      .send()
      .expect(200);

    expect(response.body.value).toBe(0);
  });

  it('retrieves updated value after incrementing', async () => {
    await request(app.getHttpServer()).put(`/counter/increment/${counterId}`);

    const response = await request(app.getHttpServer())
      .get(`/counter/${counterId}`)
      .send()
      .expect(200);

    expect(response.body.value).toBe(1);
  });

  it('handles multiple increments correctly', async () => {
    for (let i = 0; i < 3; i++) {
      await request(app.getHttpServer()).put(`/counter/increment/${counterId}`);
    }

    const response = await request(app.getHttpServer())
      .get(`/counter/${counterId}`)
      .send()
      .expect(200);

    expect(response.body.value).toBe(3);
  });
});
