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

jest.setTimeout(30000);

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

describe('Counter Tests', () => {
  it('creates a counter', async () => {
    await request(app.getHttpServer())
      .post('/counter/testapi1')
      .send()
      .expect(201)
      .expect('{"id":"testapi1","value":0}');
  });

  it('increments a counter', async () => {
    await request(app.getHttpServer())
      .post('/counter/testapi2')
      .send();
    
    await request(app.getHttpServer())
      .put('/counter/testapi2/increment')
      .send()
      .expect(200)
      .then((response) => {
        expect(response.body.value).toEqual(1);
      });
  });

  it('decrements a counter', async () => {
    await request(app.getHttpServer())
      .post('/counter/testapi3')
      .send();
    
    await request(app.getHttpServer())
      .put('/counter/testapi3/decrement')
      .send()
      .expect(200)
      .then((response) => {
        expect(response.body.value).toEqual(-1);
      });
  });

  it('resets a counter', async () => {
    await request(app.getHttpServer())
      .post('/counter/testapi4')
      .send();

    await request(app.getHttpServer())
      .put('/counter/testapi4/increment')
      .send();
    
    await request(app.getHttpServer())
      .put('/counter/testapi4/reset')
      .send()
      .expect(200)
      .then((response) => {
        expect(response.body.value).toEqual(0);
      });
  });

  it('gets a counter', async () => {
    await request(app.getHttpServer())
      .post('/counter/testapi5')
      .send();

    await request(app.getHttpServer())
      .get('/counter/testapi5')
      .send()
      .expect(200)
      .then((response) => {
        expect(response.body.id).toEqual('testapi5');
      });
  });
});