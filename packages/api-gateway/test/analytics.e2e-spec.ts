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

let apiKey: string;
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

async function createApiKey(proj: string, env: string): Promise<string> {
  const key = await request(app.getHttpServer())
    .post('/auth/key')
    .set('X-User-Email', ADMIN_EMAIL)
    .set('X-User-Password', ADMIN_PASSWORD)
    .send({
      environment: env,
      project: {
        name: proj,
      },
    });

  return key.body['apiKey'];
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
  logVisitEvent: jest.fn((data) =>
    of({
      id: 'mock-visit-event-id',
      category: 'Interaction',
      subcategory: 'Visit',
      projectId: data.configId,
      environment: data.environment,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      eventProperties: {
        pageUrl: data.pageUrl,
        userId: data.userId,
      },
    }),
  ),
  logInputEvent: jest.fn((data) =>
    of({
      id: 'mock-input-event-id',
      category: 'Interaction',
      subcategory: 'Input',
      projectId: data.configId,
      environment: data.environment,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      eventProperties: {
        objectId: data.objectId,
        userId: data.userId,
        textValue: data.textValue,
      },
    }),
  ),
  logCustomEvent: jest.fn((data) =>
    of({
      id: 'mock-custom-event-id',
      category: data.category,
      subcategory: data.subcategory,
      projectId: data.configId,
      environment: data.environment,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      eventProperties: data.properties,
    }),
  ),
  getCustomEventTypes: jest.fn(() =>
    of({
      eventTypes: [],
    }),
  ),
  getCustomGraphTypesById: jest.fn(() =>
    of({
      graphTypes: [],
    }),
  ),
  getClickEventsPaginated: jest.fn(() =>
    of({
      events: [],
      nextCursor: null,
    }),
  ),
  getAllClickEvents: jest.fn(() =>
    of({
      events: [],
    }),
  ),
  getVisitEventsPaginated: jest.fn(() =>
    of({
      events: [],
      nextCursor: null,
    }),
  ),
  getAllVisitEvents: jest.fn(() =>
    of({
      events: [],
    }),
  ),
  getInputEventsPaginated: jest.fn(() =>
    of({
      events: [],
      nextCursor: null,
    }),
  ),
  getAllInputEvents: jest.fn(() =>
    of({
      events: [],
    }),
  ),
  getCustomEventsPaginated: jest.fn(() =>
    of({
      events: [],
      nextCursor: null,
    }),
  ),
  getAllCustomEvents: jest.fn(() =>
    of({
      events: [],
    }),
  ),
};

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

  if (!apiKey) {
    apiKey = await createApiKey('test-seed-project', 'prod');

    // Create analytics config for the project
    try {
      await request(app.getHttpServer())
        .post('/analytics/config')
        .set('Authorization', 'Bearer ' + apiKey)
        .send({
          serverAnalyticsKey: 'test-server-analytics-key',
          clientAnalyticsKey: 'test-client-analytics-key',
        });
    } catch (e) {
      // Config might already exist, that's okay
    }
  }
});

describe('Analytics Event Logging Routes', () => {
  describe('POST /analytics/events/click', () => {
    it('Successfully log a click event with valid parameters', async () => {
      const apiKey = await createApiKey('test-seed-project', 'prod');
      await request(app.getHttpServer())
        .post('/analytics/events/click')
        .set('Authorization', 'Bearer ' + apiKey)
        .send({
          objectId: 'button-123',
          userId: 'user-456',
        })
        .expect(201);
    });

    it('Failed to log click event due to missing API key', async () => {
      return await request(app.getHttpServer())
        .post('/analytics/events/click')
        .send({
          objectId: 'button-123',
          userId: 'user-456',
        })
        .expect(401);
    });

    it('Failed to log click event due to invalid API key', async () => {
      return await request(app.getHttpServer())
        .post('/analytics/events/click')
        .set('Authorization', 'Bearer invalid.api.key')
        .send({
          objectId: 'button-123',
          userId: 'user-456',
        })
        .expect(401);
    });

    it('Failed to log click event due to missing objectId', async () => {
      const apiKey = await createApiKey('test-seed-project', 'prod');
      return await request(app.getHttpServer())
        .post('/analytics/events/click')
        .set('Authorization', 'Bearer ' + apiKey)
        .send({
          userId: 'user-456',
        })
        .expect(400);
    });

    it('Failed to log click event due to missing userId', async () => {
      const apiKey = await createApiKey('test-seed-project', 'prod');
      return await request(app.getHttpServer())
        .post('/analytics/events/click')
        .set('Authorization', 'Bearer ' + apiKey)
        .send({
          objectId: 'button-123',
        })
        .expect(400);
    });
  });

  describe('POST /analytics/events/visit', () => {
    it('Successfully log a visit event with valid parameters', async () => {
      const apiKey = await createApiKey('test-seed-project', 'prod');
      await request(app.getHttpServer())
        .post('/analytics/events/visit')
        .set('Authorization', 'Bearer ' + apiKey)
        .send({
          pageUrl: 'https://example.com/dashboard',
          userId: 'user-456',
        })
        .expect(201);
    });

    it('Failed to log visit event due to missing pageUrl', async () => {
      const apiKey = await createApiKey('test-seed-project', 'prod');
      return await request(app.getHttpServer())
        .post('/analytics/events/visit')
        .set('Authorization', 'Bearer ' + apiKey)
        .send({
          userId: 'user-456',
        })
        .expect(400);
    });
  });

  describe('POST /analytics/events/input', () => {
    it('Successfully log an input event with valid parameters', async () => {
      const apiKey = await createApiKey('test-seed-project', 'prod');
      await request(app.getHttpServer())
        .post('/analytics/events/input')
        .set('Authorization', 'Bearer ' + apiKey)
        .send({
          objectId: 'search-field-123',
          userId: 'user-456',
          textValue: 'search query',
        })
        .expect(201);
    });

    it('Failed to log input event due to missing textValue', async () => {
      const apiKey = await createApiKey('test-seed-project', 'prod');
      return await request(app.getHttpServer())
        .post('/analytics/events/input')
        .set('Authorization', 'Bearer ' + apiKey)
        .send({
          objectId: 'search-field-123',
          userId: 'user-456',
        })
        .expect(400);
    });
  });

  describe('POST /analytics/events/custom', () => {
    it('Successfully log a custom event with valid parameters', async () => {
      const apiKey = await createApiKey('test-seed-project', 'prod');
      await request(app.getHttpServer())
        .post('/analytics/events/custom')
        .set('Authorization', 'Bearer ' + apiKey)
        .send({
          category: 'user_action',
          subcategory: 'form_submission',
          properties: { formType: 'contact', source: 'homepage' },
        })
        .expect(201);
    });

    it('Failed to log custom event due to missing category', async () => {
      const apiKey = await createApiKey('test-seed-project', 'prod');
      return await request(app.getHttpServer())
        .post('/analytics/events/custom')
        .set('Authorization', 'Bearer ' + apiKey)
        .send({
          subcategory: 'form_submission',
          properties: { formType: 'contact' },
        })
        .expect(400);
    });

    it('Failed to log custom event due to missing subcategory', async () => {
      const apiKey = await createApiKey('test-seed-project', 'prod');
      return await request(app.getHttpServer())
        .post('/analytics/events/custom')
        .set('Authorization', 'Bearer ' + apiKey)
        .send({
          category: 'user_action',
          properties: { formType: 'contact' },
        })
        .expect(400);
    });
  });
});

describe('Analytics Event Retrieval Routes', () => {
  describe('GET /analytics/custom-event-types', () => {
    it('Successfully get custom event types with valid parameters', async () => {
      const apiKey = await createApiKey('test-seed-project', 'prod');
      await request(app.getHttpServer())
        .get('/analytics/custom-event-types')
        .set('Authorization', 'Bearer ' + apiKey)
        .query({
          projectName: 'test-seed-project',
        })
        .expect(200);
    });

    it('Failed to get custom event types due to missing project name', async () => {
      const apiKey = await createApiKey('test-seed-project', 'prod');
      return await request(app.getHttpServer())
        .get('/analytics/custom-event-types')
        .set('Authorization', 'Bearer ' + apiKey)
        .query({})
        .expect(400);
    });
  });

  describe('GET /analytics/custom-graph-types', () => {
    it('Successfully get custom graph types with valid parameters', async () => {
      const apiKey = await createApiKey('test-seed-project', 'prod');
      await request(app.getHttpServer())
        .get('/analytics/custom-graph-types')
        .set('Authorization', 'Bearer ' + apiKey)
        .query({
          projectName: 'test-seed-project',
          eventTypeId: 'event-type-123',
        })
        .expect(200);
    });

    it('Failed to get custom graph types due to missing event type ID', async () => {
      const apiKey = await createApiKey('test-seed-project', 'prod');
      return await request(app.getHttpServer())
        .get('/analytics/custom-graph-types')
        .set('Authorization', 'Bearer ' + apiKey)
        .query({
          projectName: 'test-seed-project',
        })
        .expect(400);
    });
  });

  describe('GET /analytics/events/click', () => {
    it('Successfully get paginated click events with valid parameters', async () => {
      const apiKey = await createApiKey('test-seed-project', 'prod');
      await request(app.getHttpServer())
        .get('/analytics/events/click')
        .set('Authorization', 'Bearer ' + apiKey)
        .query({
          projectName: 'test-seed-project',
          environment: 'production',
          limit: 10,
        })
        .expect(200);
    });

    it('Successfully get paginated click events with optional parameters', async () => {
      const apiKey = await createApiKey('test-seed-project', 'prod');
      await request(app.getHttpServer())
        .get('/analytics/events/click')
        .set('Authorization', 'Bearer ' + apiKey)
        .query({
          projectName: 'test-seed-project',
          afterId: 'event-123',
          environment: 'development',
          limit: 5,
          afterTime: '2023-01-01T00:00:00Z',
        })
        .expect(200);
    });

    it('Failed to get click events due to missing project name', async () => {
      const apiKey = await createApiKey('test-seed-project', 'prod');
      return await request(app.getHttpServer())
        .get('/analytics/events/click')
        .set('Authorization', 'Bearer ' + apiKey)
        .query({})
        .expect(400);
    });
  });

  describe('GET /analytics/events/click/all', () => {
    it('Successfully get all click events with valid parameters', async () => {
      const apiKey = await createApiKey('test-seed-project', 'prod');
      await request(app.getHttpServer())
        .get('/analytics/events/click/all')
        .set('Authorization', 'Bearer ' + apiKey)
        .query({
          projectName: 'test-seed-project',
          limit: 100,
        })
        .expect(200);
    });

    it('Successfully get all click events with optional afterTime parameter', async () => {
      const apiKey = await createApiKey('test-seed-project', 'prod');
      await request(app.getHttpServer())
        .get('/analytics/events/click/all')
        .set('Authorization', 'Bearer ' + apiKey)
        .query({
          projectName: 'test-seed-project',
          afterTime: '2023-01-01T00:00:00Z',
        })
        .expect(200);
    });
  });

  describe('GET /analytics/events/visit', () => {
    it('Successfully get paginated visit events with valid parameters', async () => {
      const apiKey = await createApiKey('test-seed-project', 'prod');
      await request(app.getHttpServer())
        .get('/analytics/events/visit')
        .set('Authorization', 'Bearer ' + apiKey)
        .query({
          projectName: 'test-seed-project',
          environment: 'production',
          limit: 10,
        })
        .expect(200);
    });

    it('Failed to get visit events due to unauthorized access', async () => {
      return await request(app.getHttpServer())
        .get('/analytics/events/visit')
        .query({
          projectName: 'test-seed-project',
        })
        .expect(401);
    });
  });

  describe('GET /analytics/events/visit/all', () => {
    it('Successfully get all visit events with valid parameters', async () => {
      const apiKey = await createApiKey('test-seed-project', 'prod');
      await request(app.getHttpServer())
        .get('/analytics/events/visit/all')
        .set('Authorization', 'Bearer ' + apiKey)
        .query({
          projectName: 'test-seed-project',
        })
        .expect(200);
    });
  });

  describe('GET /analytics/events/input', () => {
    it('Successfully get paginated input events with valid parameters', async () => {
      const apiKey = await createApiKey('test-seed-project', 'prod');
      await request(app.getHttpServer())
        .get('/analytics/events/input')
        .set('Authorization', 'Bearer ' + apiKey)
        .query({
          projectName: 'test-seed-project',
          environment: 'production',
          limit: 10,
        })
        .expect(200);
    });
  });

  describe('GET /analytics/events/input/all', () => {
    it('Successfully get all input events with valid parameters', async () => {
      const apiKey = await createApiKey('test-seed-project', 'prod');
      await request(app.getHttpServer())
        .get('/analytics/events/input/all')
        .set('Authorization', 'Bearer ' + apiKey)
        .query({
          projectName: 'test-seed-project',
        })
        .expect(200);
    });
  });

  describe('GET /analytics/events/custom', () => {
    it('Successfully get paginated custom events with valid parameters', async () => {
      const apiKey = await createApiKey('test-seed-project', 'prod');
      await request(app.getHttpServer())
        .get('/analytics/events/custom')
        .set('Authorization', 'Bearer ' + apiKey)
        .query({
          projectName: 'test-seed-project',
          category: 'user_action',
          subcategory: 'form_submission',
          environment: 'production',
          limit: 10,
        })
        .expect(200);
    });

    it('Failed to get custom events due to missing category', async () => {
      const apiKey = await createApiKey('test-seed-project', 'prod');
      return await request(app.getHttpServer())
        .get('/analytics/events/custom')
        .set('Authorization', 'Bearer ' + apiKey)
        .query({
          projectName: 'test-seed-project',
          subcategory: 'form_submission',
        })
        .expect(400);
    });

    it('Failed to get custom events due to missing subcategory', async () => {
      const apiKey = await createApiKey('test-seed-project', 'prod');
      return await request(app.getHttpServer())
        .get('/analytics/events/custom')
        .set('Authorization', 'Bearer ' + apiKey)
        .query({
          projectName: 'test-seed-project',
          category: 'user_action',
        })
        .expect(400);
    });
  });

  describe('GET /analytics/events/custom/all', () => {
    it('Successfully get all custom events with valid parameters', async () => {
      const apiKey = await createApiKey('test-seed-project', 'prod');
      await request(app.getHttpServer())
        .get('/analytics/events/custom/all')
        .set('Authorization', 'Bearer ' + apiKey)
        .query({
          projectName: 'test-seed-project',
          category: 'user_action',
          subcategory: 'form_submission',
        })
        .expect(200);
    });

    it('Successfully get all custom events with optional parameters', async () => {
      const apiKey = await createApiKey('test-seed-project', 'prod');
      await request(app.getHttpServer())
        .get('/analytics/events/custom/all')
        .set('Authorization', 'Bearer ' + apiKey)
        .query({
          projectName: 'test-seed-project',
          category: 'user_action',
          subcategory: 'form_submission',
          afterTime: '2023-01-01T00:00:00Z',
          limit: 50,
        })
        .expect(200);
    });

    it('Failed to get all custom events due to missing required parameters', async () => {
      const apiKey = await createApiKey('test-seed-project', 'prod');
      return await request(app.getHttpServer())
        .get('/analytics/events/custom/all')
        .set('Authorization', 'Bearer ' + apiKey)
        .query({
          projectName: 'test-seed-project',
        })
        .expect(400);
    });
  });
});

describe('Analytics Authentication and Error Handling', () => {
  it('Failed to access any analytics endpoint with invalid API key', async () => {
    const endpoints = [
      '/analytics/events/click',
      '/analytics/events/visit',
      '/analytics/events/input',
      '/analytics/events/custom',
      '/analytics/custom-event-types',
      '/analytics/custom-graph-types',
      '/analytics/events/click/all',
      '/analytics/events/visit/all',
      '/analytics/events/input/all',
      '/analytics/events/custom/all',
    ];

    for (const endpoint of endpoints) {
      await request(app.getHttpServer())
        .get(endpoint)
        .set('Authorization', 'Bearer invalid.api.key')
        .query({
          projectName: 'test-seed-project',
          ...(endpoint.includes('custom') && !endpoint.includes('types')
            ? {
                category: 'user_action',
                subcategory: 'form_submission',
              }
            : {}),
          ...(endpoint.includes('graph-types')
            ? {
                eventTypeId: 'event-type-123',
              }
            : {}),
        })
        .expect(401);
    }
  });

  it('Failed to access analytics endpoints without authorization header', async () => {
    const endpoints = [
      '/analytics/custom-event-types',
      '/analytics/events/click',
      '/analytics/events/visit/all',
    ];

    for (const endpoint of endpoints) {
      await request(app.getHttpServer())
        .get(endpoint)
        .query({
          projectName: 'test-seed-project',
          ...(endpoint.includes('custom') && !endpoint.includes('types')
            ? {
                category: 'user_action',
                subcategory: 'form_submission',
              }
            : {}),
        })
        .expect(401);
    }
  });

  it('POST endpoints should validate request bodies properly', async () => {
    const apiKey = await createApiKey('test-seed-project', 'prod');

    // Test empty body
    await request(app.getHttpServer())
      .post('/analytics/events/click')
      .set('Authorization', 'Bearer ' + apiKey)
      .send({})
      .expect(400);

    // Test invalid properties
    await request(app.getHttpServer())
      .post('/analytics/events/custom')
      .set('Authorization', 'Bearer ' + apiKey)
      .send({
        category: '',
        subcategory: 'form_submission',
        properties: 'invalid-properties',
      })
      .expect(400);
  });
});

describe('Analytics Service Routes Log Events', () => {
  it('Successfully log a click event ', async () => {
    const apiKey = await createApiKey('test-seed-project', 'prod');
    await request(app.getHttpServer())
      .post('/analytics/events/click')
      .set('Authorization', 'Bearer ' + apiKey)
      .send({
        objectId: 'button-123',
        userId: 'user-456',
      })
      .expect(201);
  });
});

describe('Analytics Service Routes Fetch Events', () => {
  it('Successfully fetch click events', async () => {
    const apiKey = await createApiKey('test-seed-project', 'prod');
    await request(app.getHttpServer())
      .get('/analytics/events/click')
      .set('Authorization', 'Bearer ' + apiKey)
      .query({
        projectName: 'test-seed-project',
      })
      .expect(200);
  });
});
