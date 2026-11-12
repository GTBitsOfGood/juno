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
import { of } from 'rxjs';
import { AnalyticsProto } from 'juno-proto';

const { ANALYTICS_SERVICE_NAME } = AnalyticsProto;

let app: INestApplication;
const ADMIN_EMAIL = 'test-superadmin@test.com';
const ADMIN_PASSWORD = 'test-password';

jest.setTimeout(15000);

async function getJwtForUser(
  userEmail: string,
  userPassword: string,
): Promise<string> {
  const resp = await request(app.getHttpServer())
    .post('/auth/user/jwt')
    .set('X-User-Email', userEmail)
    .set('X-User-Password', userPassword)
    .send();
  return resp.body['token'];
}

async function createProject(name: string): Promise<number> {
  const resp = await request(app.getHttpServer())
    .post('/project')
    .set('X-User-Email', ADMIN_EMAIL)
    .set('X-User-Password', ADMIN_PASSWORD)
    .send({ name });
  return resp.body['id'];
}

async function createApiKeyForProject(projectId: number): Promise<string> {
  const adminJwt = await getJwtForUser(ADMIN_EMAIL, ADMIN_PASSWORD);
  const resp = await request(app.getHttpServer())
    .post('/auth/key')
    .set('Authorization', `Bearer ${adminJwt}`)
    .send({
      environment: 'prod',
      project: { id: projectId },
    });
  return resp.body['apiKey'];
}

const mockAnalyticsService = {
  logClickEvent: jest.fn((data) =>
    of({
      id: 'mock-click-event-id',
      category: 'Interaction',
      subcategory: 'Click',
      projectId: data.configId,
      environment: data.environment,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      eventProperties: {
        objectId: data.objectId,
        userId: data.userId,
      },
    }),
  ),
};

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
  })
    .overrideProvider(ANALYTICS_SERVICE_NAME)
    .useValue({
      getService: () => mockAnalyticsService,
    })
    .compile();

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

describe('ProjectId decorator - API key project validation', () => {
  it('should reject API key request when x-project-id header does not match key project', async () => {
    const projectAId = await createProject('project-a-test');
    const projectBId = await createProject('project-b-test');

    const apiKeyForProjectA = await createApiKeyForProject(projectAId);

    await request(app.getHttpServer())
      .post('/analytics/events/click')
      .set('Authorization', `Bearer ${apiKeyForProjectA}`)
      .set('x-project-id', String(projectBId))
      .send({
        objectId: 'button-123',
        userId: 'user-456',
      })
      .expect(403);
  });

  it('should allow API key request when x-project-id header matches key project', async () => {
    const projectId = await createProject('project-match-test');
    const apiKey = await createApiKeyForProject(projectId);

    await request(app.getHttpServer())
      .post('/analytics/events/click')
      .set('Authorization', `Bearer ${apiKey}`)
      .set('x-project-id', String(projectId))
      .send({
        objectId: 'button-123',
        userId: 'user-456',
      })
      .expect(201);
  });

  it('should use API key project when x-project-id header is not provided', async () => {
    const projectId = await createProject('project-fallback-test');
    const apiKey = await createApiKeyForProject(projectId);

    await request(app.getHttpServer())
      .post('/analytics/events/click')
      .set('Authorization', `Bearer ${apiKey}`)
      .send({
        objectId: 'button-123',
        userId: 'user-456',
      })
      .expect(201);
  });

  it('should reject API key request when projectId query param does not match key project', async () => {
    const projectAId = await createProject('project-a-query');
    const projectBId = await createProject('project-b-query');

    const apiKeyForProjectA = await createApiKeyForProject(projectAId);

    await request(app.getHttpServer())
      .post('/analytics/events/click')
      .set('Authorization', `Bearer ${apiKeyForProjectA}`)
      .query({ projectId: projectBId })
      .send({
        objectId: 'button-123',
        userId: 'user-456',
      })
      .expect(403);
  });

  it('should allow API key request when projectId query param matches key project', async () => {
    const projectId = await createProject('project-query-match');
    const apiKey = await createApiKeyForProject(projectId);

    await request(app.getHttpServer())
      .post('/analytics/events/click')
      .set('Authorization', `Bearer ${apiKey}`)
      .query({ projectId })
      .send({
        objectId: 'button-123',
        userId: 'user-456',
      })
      .expect(201);
  });
});
