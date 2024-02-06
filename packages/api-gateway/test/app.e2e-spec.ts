import { Test, TestingModule } from '@nestjs/testing';
import {
  ClassSerializerInterceptor,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { AppModule } from './../src/app.module';
import { Reflector } from '@nestjs/core';
import * as request from 'supertest';

let app: INestApplication;
jest.setTimeout(7000);
beforeAll(async () => {
  const wait = new Promise((resolve) => {
    setTimeout(() => {
      resolve({});
    }, 6000);
  });
  await wait;
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

  await app.init();
});

// TODO: Make these actually test functionality
// describe('User Creation Routes', () => {});
// describe('Project Creation Routes', () => {});
describe('Auth Routes', () => {
  it('Returns empty value', async () => {
    await request(app.getHttpServer()).get('/auth').expect(200).expect('');
  });
});

describe('Project Creation Routes', () => {
  it('Create a project with valid inputs', async () => {
    await request(app.getHttpServer())
      .post('/project')
      .send({
        name: 'testProject',
      })
      .expect(201)
      .expect("");
  });

  it("Create a project with empty-string name", async () => {
    await request(app.getHttpServer())
      .post('/project')
      .send({
        name: '',
      })
      .expect(400)
      .expect('{"message":["name should not be empty"],"error":"Bad Request","statusCode":400}');
  });

  it("Create a project with no name field", async () => {
    await request(app.getHttpServer())
      .post('/project')
      .send({
      })
      .expect(400)
      .expect('{"message":["name should not be empty"],"error":"Bad Request","statusCode":400}');
  });

  it("Create a project with null name", async () => {
    await request(app.getHttpServer())
      .post('/project')
      .send({
        name: null,
      })
      .expect(400)
      .expect('{"message":["name should not be empty"],"error":"Bad Request","statusCode":400}');
  });

  it("Create a project with non-string name", async () => {
    await request(app.getHttpServer())
      .post('/project')
      .send({
        name: 1,
      })
      .expect(201)
      .expect("");
  });
});

describe('Project Retrieval Routes', () => {
  it('Get project with valid id', async () => {
    await request(app.getHttpServer())
      .get('/project/id/1')
      .expect(200)
      .then((response) => {
        expect(response.body.name).toEqual('testProject');
        expect(response.body.id).toEqual(1);
      })
  });

  it('Get project with valid name', async () => {
    await request(app.getHttpServer())
      .get('/project/name/testProject')
      .expect(200)
      .then((response) => {
        expect(response.body.name).toEqual('testProject');
        expect(response.body.id).toEqual(1);
      })
  });

  it('Get project with non-number id', async () => {
    await request(app.getHttpServer())
      .get('/project/id/abc')
      .expect(400)
      .expect('{"statusCode":400,"message":"id must be a number"}')
  });

  // it('Get project with non-existent id', async () => {
  //   await request(app.getHttpServer())
  //     .get('/project/id/0')
  //     .expect(400)
  //     .expect('{"statusCode":400,"message":"id does not exist"}')
  // });

  // it('Get project with non-existent name', async () => {
  //   await request(app.getHttpServer())
  //     .get('/project/name/abc')
  //     .expect(400)
  //     .expect('{"statusCode":400,"message":"name does not exist"}')
  // });
});