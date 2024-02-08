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

  it('should set a user type', () => {
    return request(app.getHttpServer())
      .post('/user/type')
      .send({
        id: 2,
        type: 'ADMIN',
      })
      .expect(201);
  });

  it('should retrieve a user by id', () => {
    return request(app.getHttpServer())
      .get('/user/id/2')
      .expect(200)
      .then((response) => {
        expect(response.body.name).toEqual('John Doe');
      });
  });

  it('should test invalid user id retrieval', () => {
    return request(app.getHttpServer()).get('/user/id/abc').expect(400);
  });

  it('should link a user to a project', async () => {
    const createProjectResponse = await request(app.getHttpServer())
      .post('/project')
      .send({
        name: 'projectName',
      })

    await request(app.getHttpServer())
      .put('/user/id/2/project')
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
