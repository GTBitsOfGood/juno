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

jest.setTimeout(10000);

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

describe('User Creation Routes', () => {
  it('Creates a user', () => {
    return request(app.getHttpServer())
      .post('/user')
      .send({
        id: '1',
        password: 'pwd123',
        name: 'John Doe',
        email: 'john@example.com',
      })
      .expect(201);
  });

  it('Tests invalid email', () => {
    return request(app.getHttpServer())
      .post('/user')
      .send({
        id: '1',
        password: 'pwd123',
        name: 'John Doe',
        email: 'john',
      })
      .expect(400);
  });

  it('Tests invalid name', () => {
    return request(app.getHttpServer())
      .post('/user')
      .send({
        password: 'pwd123',
        email: 'john@gmail.com',
      })
      .expect(400);
  });

  it('should set a user type', async () => {
    const resp = await request(app.getHttpServer()).post('/user').send({
      password: 'password',
      name: 'John Doe',
      email: 'john@anotherexample.com',
    });
    const id = resp.body['id'];
    return request(app.getHttpServer())
      .post('/user/type')
      .send({
        id: id,
        type: 'ADMIN',
      })
      .expect(201);
  });

  it('should retrieve a user by id', async () => {
    const resp = await request(app.getHttpServer()).post('/user').send({
      password: 'password',
      name: 'John Doe',
      email: 'john@retreivebyid.com',
    });
    const id = resp.body['id'];
    return request(app.getHttpServer())
      .get(`/user/id/${id}`)
      .expect(200)
      .then((response) => {
        expect(response.body.name).toEqual('John Doe');
      });
  });

  it('should test invalid user id retrieval', () => {
    return request(app.getHttpServer()).get('/user/id/abc').expect(400);
  });

  it('should link a user to a project', async () => {
    await request(app.getHttpServer()).post('/project').send({
      name: 'projectName',
    });
    const resp = await request(app.getHttpServer()).post('/user').send({
      password: 'password',
      name: 'John Doe',
      email: 'john@linktoproject.com',
    });
    const id = resp.body['id'];

    await request(app.getHttpServer())
      .put(`/user/id/${id}/project`)
      .send({
        name: 'projectName',
      })
      .expect(200);
  });

  it('should test an invalid user id', async () => {
    await request(app.getHttpServer())
      .put('/user/id/a/project')
      .send({
        name: 'projectName',
      })
      .expect(400);
  });
});
