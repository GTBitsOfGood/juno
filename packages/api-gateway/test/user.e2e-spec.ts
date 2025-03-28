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

let userJwt: string | undefined = undefined;

jest.setTimeout(15000);

async function JWTforUser(userEmail: string, userPassword: string) {
  const jwt = await request(app.getHttpServer())
    .post('/auth/user/jwt')
    .set('X-User-Email', userEmail)
    .set('X-User-Password', userPassword)
    .send();

  return jwt.body['token'];
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

  if (!userJwt) {
    userJwt = await JWTforUser(ADMIN_EMAIL, ADMIN_PASSWORD);
  }
});

const ADMIN_EMAIL = 'test-superadmin@test.com';
const ADMIN_PASSWORD = 'test-password';

describe('User Creation Routes', () => {
  it('Creates a user', () => {
    return request(app.getHttpServer())
      .post('/user')
      .set('X-User-Email', ADMIN_EMAIL)
      .set('X-User-Password', ADMIN_PASSWORD)
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
      .set('X-User-Email', ADMIN_EMAIL)
      .set('X-User-Password', ADMIN_PASSWORD)
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
      .set('X-User-Email', ADMIN_EMAIL)
      .set('X-User-Password', ADMIN_PASSWORD)
      .send({
        password: 'pwd123',
        email: 'john@gmail.com',
      })
      .expect(400);
  });

  it('should set a user type', async () => {
    const resp = await request(app.getHttpServer())
      .post('/user')
      .set('X-User-Email', ADMIN_EMAIL)
      .set('X-User-Password', ADMIN_PASSWORD)
      .send({
        password: 'password',
        name: 'John Doe',
        email: 'john@anotherexample.com',
      });
    const id = resp.body['id'];
    return request(app.getHttpServer())
      .post('/user/type')
      .set('X-User-Email', ADMIN_EMAIL)
      .set('X-User-Password', ADMIN_PASSWORD)
      .send({
        id: id,
        type: 'ADMIN',
      })
      .expect(201);
  });

  it('should retrieve a user by id', async () => {
    const resp = await request(app.getHttpServer())
      .post('/user')
      .set('X-User-Email', ADMIN_EMAIL)
      .set('X-User-Password', ADMIN_PASSWORD)
      .send({
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
    await request(app.getHttpServer())
      .post('/project')
      .set('X-User-Email', ADMIN_EMAIL)
      .set('X-User-Password', ADMIN_PASSWORD)
      .send({
        name: 'projectName',
      });
    const resp = await request(app.getHttpServer())
      .post('/user')
      .set('X-User-Email', ADMIN_EMAIL)
      .set('X-User-Password', ADMIN_PASSWORD)
      .send({
        password: 'password',
        name: 'John Doe',
        email: 'john@linktoproject.com',
      });
    const id = resp.body['id'];

    await request(app.getHttpServer())
      .put(`/user/id/${id}/project`)
      .set('X-User-Email', ADMIN_EMAIL)
      .set('X-User-Password', ADMIN_PASSWORD)
      .send({
        name: 'projectName',
      })
      .expect(200);
  });

  it('should test an invalid user id', async () => {
    await request(app.getHttpServer())
      .put('/user/id/a/project')
      .set('X-User-Email', ADMIN_EMAIL)
      .set('X-User-Password', ADMIN_PASSWORD)
      .send({
        name: 'projectName',
      })
      .expect(400);
  });
  it('get users should fail with unauthorized user', async () => {
    await request(app.getHttpServer())
      .post('/user')
      .set('X-User-Email', ADMIN_EMAIL)
      .set('X-User-Password', ADMIN_PASSWORD)
      .send({
        id: '1', //Unauthorized admin user
        password: 'pwd123',
        name: 'John Doe',
        email: 'john5@example.com',
      })
      .expect(201);

    await request(app.getHttpServer())
      .get('/user')
      .set('X-User-Email', 'john5@example.com')
      .set('X-User-Password', 'pwd123')
      .send()
      .expect(401);
  });
  it('get users should succeed with authorized user', async () => {
    await request(app.getHttpServer())
      .get('/user')
      .set('X-User-Email', ADMIN_EMAIL)
      .set('X-User-Password', ADMIN_PASSWORD)
      .send()
      .expect(200);
  });
});

describe('User Deletion Routes', () => {
  it('deletes an existing user', async () => {
    await request(app.getHttpServer())
      .post('/user')
      .set('X-User-Email', ADMIN_EMAIL)
      .set('X-User-Password', ADMIN_PASSWORD)
      .send({
        id: '1',
        password: 'pwd123',
        name: 'John Doe',
        email: 'john@example.com',
      });

    return request(app.getHttpServer())
      .delete('/user/id/1')
      .set('X-User-Email', ADMIN_EMAIL)
      .set('X-User-Password', ADMIN_PASSWORD)
      .send({
      })
      .expect(200);
  });

  it('fails to delete a nonexistent user', () => {
    return request(app.getHttpServer())
      .delete('/user/id/-1')
      .set('X-User-Email', ADMIN_EMAIL)
      .set('X-User-Password', ADMIN_PASSWORD)
      .send({
      })
      .expect(404);
  });  
});

describe('Credentials Middleware Tests (jwt authentication)', () => {
  it('gets users with authorized jwt', async () => {
    await request(app.getHttpServer())
      .get('/user')
      .set('Authorization', 'Bearer ' + userJwt)
      .send()
      .expect(200);
  });

  it('fails to get users with unauthorized user jwt', async () => {
    await request(app.getHttpServer())
      .post('/user')
      .set('X-User-Email', ADMIN_EMAIL)
      .set('X-User-Password', ADMIN_PASSWORD)
      .send({
        id: '2',
        password: 'password',
        name: 'test-unauthorized-jwt',
        email: 'test-unauthorized-jwt@example.com',
      })
      .expect(201);

    userJwt = await JWTforUser('test-unauthorized-jwt@example.com', 'password');

    await request(app.getHttpServer())
      .get('/user')
      .set('Authorization', 'Bearer ' + userJwt)
      .send()
      .expect(401);
  });

  it('fails to get users with jwt when email is nonempty', async () => {
    await request(app.getHttpServer())
      .get('/user')
      .set('X-User-Email', ADMIN_EMAIL)
      .set('Authorization', 'Bearer ' + userJwt)
      .send()
      .expect(401);
  });

  it('fails to get users with invalid jwt', async () => {
    await request(app.getHttpServer())
      .get('/user')
      .set('Authorization', 'Bearer invalid-jwt')
      .send()
      .expect(401);
  });
});
