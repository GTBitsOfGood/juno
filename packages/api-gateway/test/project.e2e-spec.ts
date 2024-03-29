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
import * as jwt from 'jsonwebtoken';

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

describe('Project Creation Routes', () => {
  it('Create a project with valid inputs', async () => {
    await request(app.getHttpServer())
      .post('/project')
      .send({
        name: 'testProject',
      })
      .expect(201)
      .expect('{"id":1,"name":"testProject"}');
  });

  it('Create a project with empty-string name', async () => {
    await request(app.getHttpServer())
      .post('/project')
      .send({
        name: '',
      })
      .expect(400)
      .expect(
        '{"message":["name should not be empty"],"error":"Bad Request","statusCode":400}',
      );
  });

  it('Create a project with no name field', async () => {
    await request(app.getHttpServer())
      .post('/project')
      .send({})
      .expect(400)
      .expect(
        '{"message":["name should not be empty"],"error":"Bad Request","statusCode":400}',
      );
  });

  it('Create a project with null name', async () => {
    await request(app.getHttpServer())
      .post('/project')
      .send({
        name: null,
      })
      .expect(400)
      .expect(
        '{"message":["name should not be empty"],"error":"Bad Request","statusCode":400}',
      );
  });

  it('Create a project with non-string name', async () => {
    await request(app.getHttpServer())
      .post('/project')
      .send({
        name: 1,
      })
      .expect(201)
      .expect('{"id":2,"name":"1"}');
  });
});

describe('Project Retrieval Routes', () => {
  it('Get project with valid id', async () => {
    const resp = await request(app.getHttpServer()).post('/project').send({
      name: 'test-retrieval',
    });
    const id = resp.body['id'];
    await request(app.getHttpServer())
      .get(`/project/id/${id}`)
      .expect(200)
      .then((response) => {
        expect(response.body.name).toEqual('test-retrieval');
        expect(response.body.id).toEqual(id);
      });
  });

  it('Get project with valid name', async () => {
    const resp = await request(app.getHttpServer()).post('/project').send({
      name: 'test-name-get',
    });
    const id = resp.body['id'];
    await request(app.getHttpServer())
      .get('/project/name/test-name-get')
      .expect(200)
      .then((response) => {
        expect(response.body.name).toEqual('test-name-get');
        expect(response.body.id).toEqual(id);
      });
  });

  it('Get project with non-number id', async () => {
    await request(app.getHttpServer())
      .get('/project/id/abc')
      .expect(400)
      .expect('id must be a number');
  });

  it('Get project with non-existent id', async () => {
    const resp = await request(app.getHttpServer())
      .get('/project/id/0')
      .expect(404);
    expect(resp.text).toContain('Project not found');
  });

  it('Get project with non-existent name', async () => {
    const resp = await request(app.getHttpServer())
      .get('/project/name/abc')
      .expect(404);
    expect(resp.text).toContain('Project not found');
  });
});

describe('Project Update Routes', () => {
  beforeAll(async () => {
    await request(app.getHttpServer()).post('/user').send({
      id: '1',
      password: '1234',
      name: 'Test User',
      email: 'test@user.com',
    });
  });

  it('Link user with project id using valid user id input', async () => {
    const project = await request(app.getHttpServer()).post('/project').send({
      name: 'link-valid',
    });
    const projectId = project.body['id'];
    const user = await request(app.getHttpServer()).post('/user').send({
      name: 'Test User',
      email: 'test@link-valid.com',
      password: 'password',
    });
    const userId = user.body['id'];
    const token = jwt.sign({}, 'secret');
    await request(app.getHttpServer())
      .put(`/project/id/${projectId}/user`)
      .set('Authorization', 'Bearer ' + token)
      .send({
        id: userId,
      })
      .expect(200);
  });

  it('Link user with project id using valid user email input', async () => {
    const token = jwt.sign({}, 'secret');
    await request(app.getHttpServer())
      .put('/project/id/1/user')
      .set('Authorization', 'Bearer ' + token)
      .send({
        email: 'test@user.com',
      })
      .expect(200);
  });

  it('Link user with project id using non-number project id param', async () => {
    const token = jwt.sign({}, 'secret');
    await request(app.getHttpServer())
      .put('/project/id/abc/user')
      .set('Authorization', 'Bearer ' + token)
      .send({
        email: 'test@user.com',
      })
      .expect(400)
      .expect('id must be a number');
  });

  it('Link user with project id using non-number user id input', async () => {
    const token = jwt.sign({}, 'secret');
    const resp = await request(app.getHttpServer())
      .put('/project/id/1/user')
      .set('Authorization', 'Bearer ' + token)
      .send({
        id: 'abc',
      })
      .expect(404);

    expect(resp.text).toContain('does not exist');
  });

  it('Link user with project id using invalid user email input', async () => {
    const token = jwt.sign({}, 'secret');
    const resp = await request(app.getHttpServer())
      .put('/project/id/1/user')
      .set('Authorization', 'Bearer ' + token)
      .send({
        email: 'abc',
      })
      .expect(404);
    expect(resp.text).toContain('does not exist');
  });
  // it('Link user with project id using non-number user id input', async () => {
  // const token = jwt.sign({}, 'secret');
  //   await request(app.getHttpServer())
  //     .put('/project/id/1/user')
  // .set('Authorization', 'Bearer ' + token)
  //     .send({
  //       id: 'abc',
  //     })
  //     .expect(400)
  //     .expect('{"statusCode":400,"message":"id must be a number"}');
  // });

  // it('Link user with project id using invalid user email input', async () => {
  // const token = jwt.sign({}, 'secret');
  //   await request(app.getHttpServer())
  //     .put('/project/id/1/user')
  // .set('Authorization', 'Bearer ' + token)
  //     .send({
  //       email: 'abc',
  //     })
  //     .expect(400)
  //     .expect('');
  // });

  it('Link user with project name using valid user id input', async () => {
    const token = jwt.sign({}, 'secret');
    await request(app.getHttpServer())
      .put('/project/name/testProject/user')
      .set('Authorization', 'Bearer ' + token)
      .send({
        id: '1',
      })
      .expect(200);
  });

  it('Link user with project name using valid user email input', async () => {
    const token = jwt.sign({}, 'secret');
    await request(app.getHttpServer())
      .put('/project/name/testProject/user')
      .set('Authorization', 'Bearer ' + token)
      .send({
        email: 'test@user.com',
      })
      .expect(200);
  });

  it('Link user with project name using non-number user id input', async () => {
    const token = jwt.sign({}, 'secret');
    const resp = await request(app.getHttpServer())
      .put('/project/name/testProject/user')
      .set('Authorization', 'Bearer ' + token)
      .send({
        id: 'abc',
      })
      .expect(404);
    expect(resp.text).toContain('does not exist');
  });

  it('Link user with project name using invalid user email input', async () => {
    const token = jwt.sign({}, 'secret');
    const resp = await request(app.getHttpServer())
      .put('/project/name/testProject/user')
      .set('Authorization', 'Bearer ' + token)
      .send({
        email: 'abc',
      })
      .expect(404);
    expect(resp.text).toContain('does not exist');
  });
  // it('Link user with project name using non-number user id input', async () => {
  // const token = jwt.sign({}, 'secret');
  //   await request(app.getHttpServer())
  //     .put('/project/name/testProject/user')
  // .set('Authorization', 'Bearer ' + token)
  //     .send({
  //       id: 'abc',
  //     })
  //     .expect(400)
  //     .expect('{"statusCode":400,"message":"id must be a number"}');
  // });

  // it('Link user with project name using invalid user email input', async () => {
  // const token = jwt.sign({}, 'secret');
  //   await request(app.getHttpServer())
  //     .put('/project/name/testProject/user')
  // .set('Authorization', 'Bearer ' + token)
  //     .send({
  //       email: 'abc',
  //     })
  //     .expect(400)
  //     .expect('');
  // });
});

describe('Project Linking Middleware', () => {
  it('No authorization headers for /project/id/:id/user route ', async () => {
    const project = await request(app.getHttpServer()).post('/project').send({
      name: 'middleware',
    });
    const projectId = project.body['id'];
    const user = await request(app.getHttpServer()).post('/user').send({
      name: 'Test User',
      email: 'test@middleware.com',
      password: 'password',
    });
    const userId = user.body['id'];
    await request(app.getHttpServer())
      .put(`/project/id/${projectId}/user`)
      .send({
        id: userId,
      })
      .expect(401);
  });
  it('No authorization headers for /project/name/:name/user route', async () => {
    await request(app.getHttpServer())
      .put('/project/name/middleware/user')
      .send({
        id: '1',
      })
      .expect(401);
  });
  it('No authorization headers for /user/id/:id/project route', async () => {
    await request(app.getHttpServer())
      .put(`/user/id/1/project`)
      .send({
        name: 'middleware',
      })
      .expect(401);
  });
  it('Invalid jwt for /project/id/:id/user route', async () => {
    await request(app.getHttpServer())
      .put(`/project/id/1/user`)
      .set('Authorization', 'Bearer invalid-jwt')
      .send({
        id: '1',
      })
      .expect(401);
  });
  it('Invalid jwt for /project/name/:name/user route', async () => {
    await request(app.getHttpServer())
      .put('/project/name/middleware/user')
      .set('Authorization', 'Bearer invalid-jwt')
      .send({
        id: '1',
      })
      .expect(401);
  });
  it('Invalid jwt for /user/id/:id/project route', async () => {
    await request(app.getHttpServer())
      .put(`/user/id/1/project`)
      .set('Authorization', 'Bearer invalid-jwt')
      .send({
        name: 'middleware',
      })
      .expect(401);
  });
  it('Valid jwt for /project/id/:id/user route', async () => {
    const token = jwt.sign({}, 'secret');
    await request(app.getHttpServer())
      .put(`/project/id/1/user`)
      .set('Authorization', 'Bearer ' + token)
      .send({
        id: '1',
      })
      .expect(200);
  });
  it('Valid jwt for /project/name/:name/user route', async () => {
    const token = jwt.sign({}, 'secret');
    await request(app.getHttpServer())
      .put('/project/name/middleware/user')
      .set('Authorization', 'Bearer ' + token)
      .send({
        id: '1',
      })
      .expect(200);
  });
  it('Valid jwt for /user/id/:id/project route', async () => {
    const token = jwt.sign({}, 'secret');
    await request(app.getHttpServer())
      .put(`/user/id/1/project`)
      .set('Authorization', 'Bearer ' + token)
      .send({
        name: 'middleware',
      })
      .expect(200);
  });
});
