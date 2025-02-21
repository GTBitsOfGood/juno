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

const ADMIN_EMAIL = 'test-superadmin@test.com';
const ADMIN_PASSWORD = 'test-password';

describe('Project Creation Routes', () => {
  it('Create a project with valid inputs', async () => {
    await request(app.getHttpServer())
      .post('/project')
      .set('X-User-Email', ADMIN_EMAIL)
      .set('X-User-Password', ADMIN_PASSWORD)
      .send({
        name: 'testProject',
      })
      .expect(201)
      .expect('{"id":1,"name":"testProject"}');
  });

  it('Create a project with empty-string name', async () => {
    await request(app.getHttpServer())
      .post('/project')
      .set('X-User-Email', ADMIN_EMAIL)
      .set('X-User-Password', ADMIN_PASSWORD)
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
      .set('X-User-Email', ADMIN_EMAIL)
      .set('X-User-Password', ADMIN_PASSWORD)
      .send({})
      .expect(400)
      .expect(
        '{"message":["name should not be empty"],"error":"Bad Request","statusCode":400}',
      );
  });

  it('Create a project with null name', async () => {
    await request(app.getHttpServer())
      .post('/project')
      .set('X-User-Email', ADMIN_EMAIL)
      .set('X-User-Password', ADMIN_PASSWORD)
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
      .set('X-User-Email', ADMIN_EMAIL)
      .set('X-User-Password', ADMIN_PASSWORD)
      .send({
        name: 1,
      })
      .expect(201)
      .expect('{"id":2,"name":"1"}');
  });
});

describe('Project Retrieval Routes', () => {
  it('Get project with valid id', async () => {
    const resp = await request(app.getHttpServer())
      .post('/project')
      .set('X-User-Email', ADMIN_EMAIL)
      .set('X-User-Password', ADMIN_PASSWORD)
      .send({
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
    const resp = await request(app.getHttpServer())
      .post('/project')
      .set('X-User-Email', ADMIN_EMAIL)
      .set('X-User-Password', ADMIN_PASSWORD)
      .send({
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
      .get('/project/id/100')
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
    await request(app.getHttpServer())
      .post('/user')
      .set('X-User-Email', ADMIN_EMAIL)
      .set('X-User-Password', ADMIN_PASSWORD)
      .send({
        password: '1234',
        name: 'Test User',
        email: 'test@user.com',
      });
  });

  it('Link user with project id using valid user id input', async () => {
    const project = await request(app.getHttpServer())
      .post('/project')
      .set('X-User-Email', ADMIN_EMAIL)
      .set('X-User-Password', ADMIN_PASSWORD)
      .send({
        name: 'link-valid',
      });
    const projectId = project.body['id'];
    const user = await request(app.getHttpServer())
      .post('/user')
      .set('X-User-Email', ADMIN_EMAIL)
      .set('X-User-Password', ADMIN_PASSWORD)
      .send({
        name: 'Test User',
        email: 'test@link-valid.com',
        password: 'password',
      });

    const userId = user.body['id'];
    const apiKey = await APIKeyForProjectName('link-valid');
    await request(app.getHttpServer())
      .put(`/project/id/${projectId}/user`)
      .set('Authorization', 'Bearer ' + apiKey)
      .send({
        id: userId,
      })
      .expect(200);
  });

  it('Link user with project id using valid user email input', async () => {
    const project = await request(app.getHttpServer())
      .post('/project')
      .set('X-User-Email', ADMIN_EMAIL)
      .set('X-User-Password', ADMIN_PASSWORD)
      .send({
        name: 'link-valid2',
      });
    const projectId = project.body['id'];
    const apiKey = await APIKeyForProjectName('link-valid2');
    await request(app.getHttpServer())
      .put(`/project/id/${projectId}/user`)
      .set('Authorization', 'Bearer ' + apiKey)
      .send({
        email: 'test@user.com',
      })
      .expect(200);
  });

  it('Link user with project id using non-number project id param', async () => {
    await request(app.getHttpServer())
      .put('/project/id/abc/user')
      .set('Authorization', 'Bearer ' + apiKey)
      .send({
        email: 'test@user.com',
      })
      .expect(400);
  });

  it('Link user with project id using non-number user id input', async () => {
    await request(app.getHttpServer())
      .put('/project/id/0/user')
      .set('Authorization', 'Bearer ' + apiKey)
      .send({
        id: 'abc',
      })
      .expect(400);
  });

  it('Link user with project id using invalid user email input', async () => {
    const resp = await request(app.getHttpServer())
      .put('/project/id/0/user')
      .set('Authorization', 'Bearer ' + apiKey)
      .send({
        email: 'abc',
      })
      .expect(404);
    expect(resp.text).toContain('does not exist');
  });
  // it('Link user with project id using non-number user id input', async () => {
  // const token = apiKeyForProject(projectId);
  //   await request(app.getHttpServer())
  //     .put('/project/id/1/user')
  // .set('Authorization', 'Bearer '+ apiKey)
  //     .send({
  //       id: 'abc',
  //     })
  //     .expect(400)
  //     .expect('{"statusCode":400,"message":"id must be a number"}');
  // });

  // it('Link user with project id using invalid user email input', async () => {
  // const token = apiKeyForProject(projectId);
  //   await request(app.getHttpServer())
  //     .put('/project/id/1/user')
  // .set('Authorization', 'Bearer '+ apiKey)
  //     .send({
  //       email: 'abc',
  //     })
  //     .expect(400)
  //     .expect('');
  // });

  it('Link user with project name using valid user id input', async () => {
    await request(app.getHttpServer())
      .put('/project/name/test-seed-project/user')
      .set('Authorization', 'Bearer ' + apiKey)
      .send({
        id: '1',
      })
      .expect(200);
  });

  it('Link user with project name using valid user email input', async () => {
    await request(app.getHttpServer())
      .put('/project/name/test-seed-project/user')
      .set('Authorization', 'Bearer ' + apiKey)
      .send({
        email: 'test@user.com',
      })
      .expect(200);
  });

  it('Link user with project name using non-number user id input', async () => {
    const resp = await request(app.getHttpServer())
      .put('/project/name/test-seed-project/user')
      .set('Authorization', 'Bearer ' + apiKey)
      .send({
        id: 'abc',
      })
      .expect(400);
    expect(resp.text).toContain('Project id must be numeric');
  });

  it('Link user with project name using invalid user email input', async () => {
    const resp = await request(app.getHttpServer())
      .put('/project/name/test-seed-project/user')
      .set('Authorization', 'Bearer ' + apiKey)
      .send({
        email: 'abc',
      })
      .expect(404);
    expect(resp.text).toContain('does not exist');
  });
  // it('Link user with project name using non-number user id input', async () => {
  // const token = apiKeyForProject(projectId);
  //   await request(app.getHttpServer())
  //     .put('/project/name/testProject/user')
  // .set('Authorization', 'Bearer '+ apiKey)
  //     .send({
  //       id: 'abc',
  //     })
  //     .expect(400)
  //     .expect('{"statusCode":400,"message":"id must be a number"}');
  // });

  // it('Link user with project name using invalid user email input', async () => {
  // const token = apiKeyForProject(projectId);
  //   await request(app.getHttpServer())
  //     .put('/project/name/testProject/user')
  // .set('Authorization', 'Bearer '+ apiKey)
  //     .send({
  //       email: 'abc',
  //     })
  //     .expect(400)
  //     .expect('');
  // });
});

describe('Project API Key Routes', () => {
  it('Create an API key for a project with valid inputs', async () => {
    const resp = await request(app.getHttpServer())
      .post('/auth/key')
      .set('X-User-Email', ADMIN_EMAIL)
      .set('X-User-Password', ADMIN_PASSWORD)
      .send({
        environment: 'prod',
        project: {
          name: 'test-seed-project',
        },
      })
      .expect(201);
    expect(resp.body['apiKey']).toBeDefined();
  });

  it('Deletes an API key for a project with valid inputs', async () => {
    const resp = await request(app.getHttpServer())
      .post('/auth/key')
      .set('X-User-Email', ADMIN_EMAIL)
      .set('X-User-Password', ADMIN_PASSWORD)
      .send({
        environment: 'prod',
        project: {
          name: 'test-seed-project',
        },
      })
      .expect(201);

    expect(resp.body['apiKey']).toBeDefined();

    await request(app.getHttpServer())
      .delete('/auth/key')
      .set('Authorization', `Bearer ${resp.body['apiKey']}`)
      .send()
      .expect(200);
  });

  it('Create an API Key for a project with invalid user/pass', async () => {
    await request(app.getHttpServer())
      .post('/auth/key')
      .set('X-User-Email', ADMIN_EMAIL)
      .set('X-User-Password', 'not-a-pass')
      .send({
        environment: 'prod',
        project: {
          name: 'test-seed-project',
        },
      })
      .expect(401);
  });
});

describe('Project Linking Middleware', () => {
  it('No authorization headers for /project/id/:id/user route ', async () => {
    const project = await request(app.getHttpServer())
      .post('/project')
      .set('X-User-Email', ADMIN_EMAIL)
      .set('X-User-Password', ADMIN_PASSWORD)
      .send({
        name: 'middleware',
      });
    const projectId = project.body['id'];
    const user = await request(app.getHttpServer())
      .post('/user')
      .set('X-User-Email', ADMIN_EMAIL)
      .set('X-User-Password', ADMIN_PASSWORD)
      .send({
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
  it('Invalid api key for /project/id/:id/user route', async () => {
    await request(app.getHttpServer())
      .put(`/project/id/1/user`)
      .set('Authorization', 'Bearer invalid-api key')
      .send({
        id: '1',
      })
      .expect(401);
  });
  it('Invalid api key for /project/name/:name/user route', async () => {
    await request(app.getHttpServer())
      .put('/project/name/middleware/user')
      .set('Authorization', 'Bearer invalid-api key')
      .send({
        id: '1',
      })
      .expect(401);
  });
  it('Invalid api key for /user/id/:id/project route', async () => {
    await request(app.getHttpServer())
      .put(`/user/id/1/project`)
      .set('Authorization', 'Bearer invalid-api key')
      .send({
        name: 'middleware',
      })
      .expect(401);
  });
  it('Valid api key for /project/id/:id/user route', async () => {
    await request(app.getHttpServer())
      .put(`/project/id/0/user`)
      .set('Authorization', 'Bearer ' + apiKey)
      .send({
        id: '1',
      })
      .expect(200);
  });
  it('Valid api key for /project/name/:name/user route', async () => {
    await request(app.getHttpServer())
      .put('/project/name/test-seed-project/user')
      .set('Authorization', 'Bearer ' + apiKey)
      .send({
        id: '1',
      })
      .expect(200);
  });
  it('get projects should fail with unauthorized user', async () => {
    //Create unauthorized user
    await request(app.getHttpServer())
      .post('/user')
      .set('X-User-Email', ADMIN_EMAIL)
      .set('X-User-Password', ADMIN_PASSWORD)
      .send({
        id: '2', //Regular user
        password: 'pwd123',
        name: 'John Doe',
        email: 'john@example.com',
      })
      .expect(201);

    await request(app.getHttpServer())
      .get('/project')
      .set('X-User-Email', 'john@example.com')
      .set('X-User-Password', 'pwd123')
      .send()
      .expect(401);
  });
  it('get users from a project should fail with unauthorized user', async () => {
    //Create unauthorized user
    await request(app.getHttpServer())
      .post('/user')
      .set('X-User-Email', ADMIN_EMAIL)
      .set('X-User-Password', ADMIN_PASSWORD)
      .send({
        id: '2', //Regular user
        password: 'pwd123',
        name: 'John Doe',
        email: 'john@example.com',
      })
      .expect(201);
    //Create project
    const project = await request(app.getHttpServer())
      .post('/project')
      .set('X-User-Email', ADMIN_EMAIL)
      .set('X-User-Password', ADMIN_PASSWORD)
      .send({
        name: 'testProject',
      })
      .expect(201);
    const projectId = project.body['id'];

    await request(app.getHttpServer())
      .get(`/project/${projectId}/users`)
      .set('X-User-Email', 'john@example.com')
      .set('X-User-Password', 'pwd123')
      .send()
      .expect(401);
  });
  it('get users from a project should fail with admin not linked to the project', async () => {
    //Create unauthorized user
    await request(app.getHttpServer())
      .post('/user')
      .set('X-User-Email', ADMIN_EMAIL)
      .set('X-User-Password', ADMIN_PASSWORD)
      .send({
        id: '1', //Regular user
        password: 'pwd123',
        name: 'John Doe',
        email: 'john@example.com',
      })
      .expect(201);
    //Create project
    const project = await request(app.getHttpServer())
      .post('/project')
      .set('X-User-Email', ADMIN_EMAIL)
      .set('X-User-Password', ADMIN_PASSWORD)
      .send({
        name: 'testProject',
      })
      .expect(201);
    const projectId = project.body['id'];

    await request(app.getHttpServer())
      .get(`/project/${projectId}/users`)
      .set('X-User-Email', 'john@example.com')
      .set('X-User-Password', 'pwd123')
      .send()
      .expect(401);
  });
  it('get users from a project should succeed with admin linked to the project', async () => {
    //Create unauthorized user
    await request(app.getHttpServer())
      .post('/user')
      .set('X-User-Email', ADMIN_EMAIL)
      .set('X-User-Password', ADMIN_PASSWORD)
      .send({
        id: '2', //Regular user
        password: 'pwd123',
        name: 'John Doe',
        email: 'john@example.com',
      })
      .expect(201);
    //Create project
    const project = await request(app.getHttpServer())
      .post('/project')
      .set('X-User-Email', ADMIN_EMAIL)
      .set('X-User-Password', ADMIN_PASSWORD)
      .send({
        name: 'testProject',
      })
      .expect(201);
    const projectId = project.body['id'];
    //Link project
    await request(app.getHttpServer())
      .put('/project/name/testProject/user')
      .set('X-User-Email', ADMIN_EMAIL)
      .set('X-User-Password', ADMIN_PASSWORD)
      .send({
        email: 'john@example.com',
      })
      .expect(200);

    await request(app.getHttpServer())
      .get(`/project/${projectId}/users`)
      .set('X-User-Email', 'john@example.com')
      .set('X-User-Password', 'pwd123')
      .send()
      .expect(200);
  });
});
