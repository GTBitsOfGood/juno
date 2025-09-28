import { Test, TestingModule } from '@nestjs/testing';
import { INestMicroservice } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import * as ProtoLoader from '@grpc/proto-loader';
import * as GRPC from '@grpc/grpc-js';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ResetProtoFile, AnalyticsProto, AnalyticsProtoFile } from 'juno-proto';
import { BogAnalyticsService } from 'src/bog-analytics.service';

const { JUNO_ANALYTICS_SERVICE_ANALYTICS_PACKAGE_NAME } = AnalyticsProto;

let app: INestMicroservice;

const mockBogAnalyticsService = {
  authenticate: jest.fn(),
  logClickEvent: jest.fn().mockImplementation((event) =>
    Promise.resolve({
      _id: 'id',
      category: 'category',
      subcategory: 'subcategory',
      projectId: 'project-id',
      environment: 'test',
      createdAt: new Date(),
      updatedAt: new Date(),
      eventProperties: { objectId: event.objectId, userId: event.userId },
    }),
  ),
  logInputEvent: jest.fn().mockImplementation((event) =>
    Promise.resolve({
      _id: 'id',
      category: 'category',
      subcategory: 'subcategory',
      projectId: 'project-id',
      environment: 'test',
      createdAt: new Date(),
      updatedAt: new Date(),
      eventProperties: {
        objectId: event.objectId,
        userId: event.userId,
        textValue: event.textValue,
      },
    }),
  ),
  logVisitEvent: jest.fn().mockImplementation((event) =>
    Promise.resolve({
      _id: 'id',
      category: 'category',
      subcategory: 'subcategory',
      projectId: 'project-id',
      environment: 'test',
      createdAt: new Date(),
      updatedAt: new Date(),
      eventProperties: { pageUrl: event.pageUrl, userId: event.userId },
    }),
  ),
  logCustomEvent: jest
    .fn()
    .mockImplementation((category, subcategory, properties) =>
      Promise.resolve({
        _id: 'id',
        eventTypeId: 'event-type-id',
        projectId: 'project-id',
        environment: 'test',
        createdAt: new Date(),
        updatedAt: new Date(),
        properties: properties,
      }),
    ),
};

jest.setTimeout(10000);

async function initApp() {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(BogAnalyticsService)
    .useValue(mockBogAnalyticsService)
    .compile();

  const app = moduleFixture.createNestMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: [JUNO_ANALYTICS_SERVICE_ANALYTICS_PACKAGE_NAME],
      protoPath: [AnalyticsProtoFile],
      url: process.env.ANALYTICS_SERVICE_ADDR,
    },
  });

  await app.init();

  await app.listen();
  return app;
}

beforeAll(async () => {
  app = await initApp();

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

describe('Analytics Service Authenticate Domain Tests', () => {
  let analyticsClient: any;
  beforeEach(async () => {
    const proto = ProtoLoader.loadSync([AnalyticsProtoFile]) as any;
    const protoGRPC = GRPC.loadPackageDefinition(proto) as any;
    // TODO: rename analytics_service proto to just juno.analytics
    analyticsClient =
      new protoGRPC.juno.analytics_service.analytics.AnalyticsService(
        process.env.ANALYTICS_SERVICE_ADDR,
        GRPC.credentials.createInsecure(),
      );
  });

  it('Log click event with valid api key', async () => {
    const request = {
      apiKey: 'mock-api-key-123',
      objectId: 'button-1',
      userId: 'user-123',
    } as AnalyticsProto.ClickEventRequest;
    const response: AnalyticsProto.ClickEventResponse = await new Promise(
      (resolve, reject) => {
        analyticsClient.logClickEvent(request, (err, response) => {
          if (err) {
            reject(err);
          } else {
            resolve(response);
          }
        });
      },
    );

    expect(response).toBeDefined();
    expect(response.eventProperties.objectId).toBe('button-1');
    expect(response.eventProperties.userId).toBe('user-123');
  });

  it('Log click event with invalid api key', async () => {
    const request = {
      apiKey: 'invalid-api-key',
      objectId: 'button-1',
      userId: 'user-123',
    };

    try {
      await new Promise((resolve, reject) => {
        analyticsClient.logClickEvent(request, (err, response) => {
          if (err) {
            reject(err);
          } else {
            resolve(response);
          }
        });
      });
      fail('Expected error was not thrown');
    } catch (err) {
      expect(err).toBeDefined();
    }
  });

  it('Log visit event with valid api key', async () => {
    const request = {
      apiKey: 'mock-api-key-123',
      pageUrl: 'https://example.com/page',
      userId: 'user-123',
    } as AnalyticsProto.VisitEventRequest;
    const response: AnalyticsProto.VisitEventResponse = await new Promise(
      (resolve, reject) => {
        analyticsClient.logVisitEvent(request, (err, response) => {
          if (err) {
            reject(err);
          } else {
            resolve(response);
          }
        });
      },
    );

    expect(response).toBeDefined();
    expect(response.eventProperties.pageUrl).toBe('https://example.com/page');
    expect(response.eventProperties.userId).toBe('user-123');
  });

  it('Log visit event with invalid api key', async () => {
    const request = {
      apiKey: 'invalid-api-key',
      pageUrl: 'https://example.com/page',
      userId: 'user-123',
    };

    try {
      await new Promise((resolve, reject) => {
        analyticsClient.logVisitEvent(request, (err, response) => {
          if (err) {
            reject(err);
          } else {
            resolve(response);
          }
        });
      });
      fail('Expected error was not thrown');
    } catch (err) {
      expect(err).toBeDefined();
    }
  });

  it('Log input event with valid api key', async () => {
    const request = {
      apiKey: 'mock-api-key-123',
      objectId: 'input-field-1',
      userId: 'user-123',
      textValue: 'user input text',
    } as AnalyticsProto.InputEventRequest;
    const response: AnalyticsProto.InputEventResponse = await new Promise(
      (resolve, reject) => {
        analyticsClient.logInputEvent(request, (err, response) => {
          if (err) {
            reject(err);
          } else {
            resolve(response);
          }
        });
      },
    );

    expect(response).toBeDefined();
    expect(response.eventProperties.objectId).toBe('input-field-1');
    expect(response.eventProperties.userId).toBe('user-123');
    expect(response.eventProperties.textValue).toBe('user input text');
  });

  it('Log input event with invalid api key', async () => {
    const request = {
      apiKey: 'invalid-api-key',
      objectId: 'input-field-1',
      userId: 'user-123',
      textValue: 'user input text',
    };

    try {
      await new Promise((resolve, reject) => {
        analyticsClient.logInputEvent(request, (err, response) => {
          if (err) {
            reject(err);
          } else {
            resolve(response);
          }
        });
      });
      fail('Expected error was not thrown');
    } catch (err) {
      expect(err).toBeDefined();
    }
  });

  it('Log custom event with valid api key', async () => {
    const request = {
      apiKey: 'mock-api-key-123',
      category: 'user-action',
      subcategory: 'form-submit',
      properties: {
        formType: 'contact',
        formId: 'contact-form-1',
      },
    } as AnalyticsProto.CustomEventRequest;
    const response: AnalyticsProto.CustomEventResponse = await new Promise(
      (resolve, reject) => {
        analyticsClient.logCustomEvent(request, (err, response) => {
          if (err) {
            reject(err);
          } else {
            resolve(response);
          }
        });
      },
    );

    expect(response).toBeDefined();
    expect(response.properties.formType).toBe('contact');
    expect(response.properties.formId).toBe('contact-form-1');
  });

  it('Log custom event with invalid api key', async () => {
    const request = {
      apiKey: 'invalid-api-key',
      category: 'user-action',
      subcategory: 'form-submit',
      properties: {
        formType: 'contact',
      },
    };

    try {
      await new Promise((resolve, reject) => {
        analyticsClient.logCustomEvent(request, (err, response) => {
          if (err) {
            reject(err);
          } else {
            resolve(response);
          }
        });
      });
      fail('Expected error was not thrown');
    } catch (err) {
      expect(err).toBeDefined();
    }
  });
});
