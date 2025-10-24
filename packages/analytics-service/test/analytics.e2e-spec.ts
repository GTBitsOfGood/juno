import { Test, TestingModule } from '@nestjs/testing';
import { INestMicroservice } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import * as ProtoLoader from '@grpc/proto-loader';
import * as GRPC from '@grpc/grpc-js';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import {
  BogAnalyticsService,
  AnalyticsViewerService,
} from 'src/bog-analytics.service';
import {
  ResetProtoFile,
  AnalyticsProto,
  AnalyticsProtoFile,
  AnalyticsConfigProtoFile,
} from 'juno-proto';

const { JUNO_ANALYTICS_SERVICE_ANALYTICS_PACKAGE_NAME } = AnalyticsProto;

let app: INestMicroservice;
let analyticsConfigClient: any;

const mockBogAnalyticsService = {
  authenticate: jest.fn(),
  logClickEvent: jest.fn().mockImplementation((event) =>
    Promise.resolve({
      _id: 'mock-click-event-id',
      category: 'Interaction',
      subcategory: 'Click',
      projectId: 'test-project-id',
      environment: 'development',
      createdAt: new Date(),
      updatedAt: new Date(),
      eventProperties: { objectId: event.objectId, userId: event.userId },
    }),
  ),
  logInputEvent: jest.fn().mockImplementation((event) =>
    Promise.resolve({
      _id: 'mock-input-event-id',
      category: 'Interaction',
      subcategory: 'Input',
      projectId: 'test-project-id',
      environment: 'development',
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
      _id: 'mock-visit-event-id',
      category: 'Activity',
      subcategory: 'Visit',
      projectId: 'test-project-id',
      environment: 'development',
      createdAt: new Date(),
      updatedAt: new Date(),
      eventProperties: { pageUrl: event.pageUrl, userId: event.userId },
    }),
  ),
  logCustomEvent: jest
    .fn()
    .mockImplementation((category, subcategory, properties) =>
      Promise.resolve({
        _id: 'mock-custom-event-id',
        eventTypeId: 'custom-event-type-id',
        projectId: 'test-project-id',
        environment: 'development',
        createdAt: new Date(),
        updatedAt: new Date(),
        properties: properties,
      }),
    ),
};

const mockAnalyticsViewerService = {
  authenticate: jest.fn(),

  // Custom Event Types
  getCustomEventTypes: jest.fn().mockImplementation(() =>
    Promise.resolve([
      {
        _id: 'custom-event-type-1',
        category: 'user-action',
        subcategory: 'form-submission',
        properties: ['formType', 'formId', 'userId'],
        projectId: 'test-project-id',
        environment: 'development',
      },
      {
        _id: 'custom-event-type-2',
        category: 'user-action',
        subcategory: 'button-click',
        properties: ['buttonId', 'buttonText', 'userId'],
        projectId: 'test-project-id',
        environment: 'development',
      },
    ]),
  ),

  // Custom Graph Types
  getCustomGraphTypesbyId: jest.fn().mockImplementation(() =>
    Promise.resolve([
      {
        _id: 'graph-1',
        eventTypeId: 'custom-event-type-1',
        projectId: 'test-project-id',
        graphTitle: 'Form Submissions Over Time',
        xProperty: 'createdAt',
        yProperty: 'count',
        graphType: 'line',
        caption: 'Track form submission trends',
      },
      {
        _id: 'graph-2',
        eventTypeId: 'custom-event-type-1',
        projectId: 'test-project-id',
        graphTitle: 'Form Types Distribution',
        xProperty: 'formType',
        yProperty: 'count',
        graphType: 'pie',
        caption: 'Distribution of form types',
      },
    ]),
  ),

  // Click Events
  getClickEventsPaginated: jest.fn().mockImplementation(() =>
    Promise.resolve({
      events: [
        {
          _id: 'click-1',
          category: 'Interaction',
          subcategory: 'Click',
          projectId: 'test-project-id',
          environment: 'development',
          createdAt: new Date(),
          updatedAt: new Date(),
          eventProperties: { objectId: 'button-1', userId: 'user-1' },
        },
        {
          _id: 'click-2',
          category: 'Interaction',
          subcategory: 'Click',
          projectId: 'test-project-id',
          environment: 'development',
          createdAt: new Date(),
          updatedAt: new Date(),
          eventProperties: { objectId: 'button-2', userId: 'user-2' },
        },
      ],
      afterId: 'click-2',
    }),
  ),

  getAllClickEvents: jest.fn().mockImplementation(() =>
    Promise.resolve([
      {
        _id: 'click-1',
        category: 'Interaction',
        subcategory: 'Click',
        projectId: 'test-project-id',
        environment: 'development',
        createdAt: new Date(),
        updatedAt: new Date(),
        eventProperties: { objectId: 'button-1', userId: 'user-1' },
      },
      {
        _id: 'click-2',
        category: 'Interaction',
        subcategory: 'Click',
        projectId: 'test-project-id',
        environment: 'development',
        createdAt: new Date(),
        updatedAt: new Date(),
        eventProperties: { objectId: 'button-2', userId: 'user-2' },
      },
    ]),
  ),

  // Visit Events
  getVisitEventsPaginated: jest.fn().mockImplementation(() =>
    Promise.resolve({
      events: [
        {
          _id: 'visit-1',
          category: 'Activity',
          subcategory: 'Visit',
          projectId: 'test-project-id',
          environment: 'development',
          createdAt: new Date(),
          updatedAt: new Date(),
          eventProperties: { pageUrl: '/home', userId: 'user-1' },
        },
        {
          _id: 'visit-2',
          category: 'Activity',
          subcategory: 'Visit',
          projectId: 'test-project-id',
          environment: 'development',
          createdAt: new Date(),
          updatedAt: new Date(),
          eventProperties: { pageUrl: '/about', userId: 'user-2' },
        },
      ],
      afterId: 'visit-2',
    }),
  ),

  getAllVisitEvents: jest.fn().mockImplementation(() =>
    Promise.resolve([
      {
        _id: 'visit-1',
        category: 'Activity',
        subcategory: 'Visit',
        projectId: 'test-project-id',
        environment: 'development',
        createdAt: new Date(),
        updatedAt: new Date(),
        eventProperties: { pageUrl: '/home', userId: 'user-1' },
      },
    ]),
  ),

  // Input Events
  getInputEventsPaginated: jest.fn().mockImplementation(() =>
    Promise.resolve({
      events: [
        {
          _id: 'input-1',
          category: 'Interaction',
          subcategory: 'Input',
          projectId: 'test-project-id',
          environment: 'development',
          createdAt: new Date(),
          updatedAt: new Date(),
          eventProperties: {
            objectId: 'search-field',
            userId: 'user-1',
            textValue: 'analytics query',
          },
        },
      ],
      afterId: 'input-1',
    }),
  ),

  getAllInputEvents: jest.fn().mockImplementation(() =>
    Promise.resolve([
      {
        _id: 'input-1',
        category: 'Interaction',
        subcategory: 'Input',
        projectId: 'test-project-id',
        environment: 'development',
        createdAt: new Date(),
        updatedAt: new Date(),
        eventProperties: {
          objectId: 'search-field',
          userId: 'user-1',
          textValue: 'analytics query',
        },
      },
    ]),
  ),

  // Custom Events
  getCustomEventsPaginated: jest.fn().mockImplementation(() =>
    Promise.resolve({
      events: [
        {
          _id: 'custom-1',
          eventTypeId: 'custom-event-type-1',
          projectId: 'test-project-id',
          environment: 'development',
          createdAt: new Date(),
          updatedAt: new Date(),
          properties: {
            formType: 'contact',
            formId: 'contact-form-1',
            userId: 'user-1',
          },
        },
      ],
      afterId: 'custom-1',
    }),
  ),

  getAllCustomEvents: jest.fn().mockImplementation(() =>
    Promise.resolve([
      {
        _id: 'custom-1',
        eventTypeId: 'custom-event-type-1',
        projectId: 'test-project-id',
        environment: 'development',
        createdAt: new Date(),
        updatedAt: new Date(),
        properties: {
          formType: 'contact',
          formId: 'contact-form-1',
          userId: 'user-1',
        },
      },
    ]),
  ),
};

jest.setTimeout(10000);

async function initApp() {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider('BOG_ANALYTICS')
    .useValue(mockBogAnalyticsService)
    .overrideProvider(AnalyticsViewerService)
    .useValue(mockAnalyticsViewerService)
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

  // Setup analytics config client
  const configProto = ProtoLoader.loadSync([AnalyticsConfigProtoFile]) as any;
  const configProtoGRPC = GRPC.loadPackageDefinition(configProto) as any;
  analyticsConfigClient =
    new configProtoGRPC.juno.analytics_service.analytics_config.AnalyticsConfigDbService(
      process.env.DB_SERVICE_ADDR,
      GRPC.credentials.createInsecure(),
    );

  // Create analytics config for testing
  await new Promise((resolve, reject) => {
    analyticsConfigClient.createAnalyticsConfig(
      {
        projectId: 0,
        environment: 'test',
        analyticsKey: 'mock-api-key-123',
      },
      (err, response) => {
        if (err) reject(err);
        else resolve(response);
      },
    );
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

  it('Log click event with valid analytics config', async () => {
    const request = {
      projectId: 0,
      environment: 'test',
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

  it('Log click event with invalid analytics config', async () => {
    const request = {
      projectId: 999,
      environment: 'nonexistent',
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

  it('Log visit event with valid analytics config', async () => {
    const request = {
      projectId: 0,
      environment: 'test',
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

  it('Log visit event with invalid analytics config', async () => {
    const request = {
      projectId: 999,
      environment: 'nonexistent',
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

  it('Log input event with valid analytics config', async () => {
    const request = {
      projectId: 0,
      environment: 'test',
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

  it('Log input event with invalid analytics config', async () => {
    const request = {
      projectId: 999,
      environment: 'nonexistent',
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

  it('Log custom event with valid analytics config', async () => {
    const request = {
      projectId: 0,
      environment: 'test',
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

  it('Log custom event with invalid analytics config', async () => {
    const request = {
      projectId: 999,
      environment: 'nonexistent',
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

describe('Analytics Service Viewer Tests', () => {
  let analyticsClient: any;

  beforeEach(async () => {
    const proto = ProtoLoader.loadSync([AnalyticsProtoFile]) as any;
    const protoGRPC = GRPC.loadPackageDefinition(proto) as any;
    analyticsClient =
      new protoGRPC.juno.analytics_service.analytics.AnalyticsService(
        process.env.ANALYTICS_SERVICE_ADDR,
        GRPC.credentials.createInsecure(),
      );
  });

  describe('Custom Event Types', () => {
    it('should get custom event types with valid api key', async () => {
      const request = {
        apiKey: 'mock-api-key-123',
        projectName: 'test-project',
      } as AnalyticsProto.CustomEventTypeRequest;

      const response: AnalyticsProto.CustomEventTypeResponse =
        await new Promise((resolve, reject) => {
          analyticsClient.getCustomEventTypes(request, (err, response) => {
            if (err) {
              reject(err);
            } else {
              resolve(response);
            }
          });
        });

      expect(response).toBeDefined();
      expect(response.id).toBe('custom-event-type-1');
      expect(response.category).toBe('user-action');
      expect(response.subcategory).toBe('form-submission');
      expect(response.properties).toContain('formType');
      expect(response.properties).toContain('userId');
      expect(response.projectId).toBe('test-project-id');
    });

    it('should fail to get custom event types with invalid api key', async () => {
      const request = {
        apiKey: 'invalid-api-key',
        projectName: 'test-project',
      };

      try {
        await new Promise((resolve, reject) => {
          analyticsClient.getCustomEventTypes(request, (err, response) => {
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

    it('should fail to get custom event types with empty project name', async () => {
      const request = {
        apiKey: 'mock-api-key-123',
        projectName: '',
      };

      try {
        await new Promise((resolve, reject) => {
          analyticsClient.getCustomEventTypes(request, (err, response) => {
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

  describe('Custom Graph Types', () => {
    it('should get custom graph types by id with valid parameters', async () => {
      const request = {
        apiKey: 'mock-api-key-123',
        projectName: 'test-project',
        eventTypeId: 'custom-event-type-1',
      } as AnalyticsProto.CustomGraphTypeRequest;

      const response: AnalyticsProto.CustomGraphTypeResponse =
        await new Promise((resolve, reject) => {
          analyticsClient.getCustomGraphTypesById(request, (err, response) => {
            if (err) {
              reject(err);
            } else {
              resolve(response);
            }
          });
        });

      expect(response).toBeDefined();
      expect(response.graphs).toHaveLength(2);
      expect(response.graphs[0].id).toBe('graph-1');
      expect(response.graphs[0].graphTitle).toBe('Form Submissions Over Time');
      expect(response.graphs[0].graphType).toBe('line');
      expect(response.graphs[1].graphType).toBe('pie');
    });

    it('should fail to get custom graph types with invalid api key', async () => {
      const request = {
        apiKey: 'invalid-api-key',
        projectName: 'test-project',
        eventTypeId: 'custom-event-type-1',
      };

      try {
        await new Promise((resolve, reject) => {
          analyticsClient.getCustomGraphTypesById(request, (err, response) => {
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

  describe('Click Events Retrieval', () => {
    it('should get paginated click events with valid parameters', async () => {
      const request = {
        apiKey: 'mock-api-key-123',
        projectName: 'test-project',
        afterId: '',
        environment: 'development',
        limit: 10,
        afterTime: '',
      } as AnalyticsProto.GetClickEventsRequest;

      const response: AnalyticsProto.GetClickEventsResponse = await new Promise(
        (resolve, reject) => {
          analyticsClient.getClickEventsPaginated(request, (err, response) => {
            if (err) {
              reject(err);
            } else {
              resolve(response);
            }
          });
        },
      );

      expect(response).toBeDefined();
      expect(response.events).toHaveLength(2);
      expect(response.events[0].id).toBe('click-1');
      expect(response.events[0].eventProperties.objectId).toBe('button-1');
      expect(response.events[0].eventProperties.userId).toBe('user-1');
      expect(response.afterId).toBe('click-2');
    });

    it('should get all click events with valid parameters', async () => {
      const request = {
        apiKey: 'mock-api-key-123',
        projectName: 'test-project',
        afterTime: '',
        limit: 0,
      } as AnalyticsProto.GetAllClickEventsRequest;

      const response: AnalyticsProto.GetAllClickEventsResponse =
        await new Promise((resolve, reject) => {
          analyticsClient.getAllClickEvents(request, (err, response) => {
            if (err) {
              reject(err);
            } else {
              resolve(response);
            }
          });
        });

      expect(response).toBeDefined();
      expect(response.events).toHaveLength(2);
      expect(response.events[0].eventProperties.objectId).toBe('button-1');
    });

    it('should fail to get click events with invalid api key', async () => {
      const request = {
        apiKey: 'invalid-api-key',
        projectName: 'test-project',
        afterId: '',
        environment: 'development',
        limit: 10,
        afterTime: '',
      };

      try {
        await new Promise((resolve, reject) => {
          analyticsClient.getClickEventsPaginated(request, (err, response) => {
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

  describe('Visit Events Retrieval', () => {
    it('should get paginated visit events with valid parameters', async () => {
      const request = {
        apiKey: 'mock-api-key-123',
        projectName: 'test-project',
        afterId: '',
        environment: 'development',
        limit: 10,
        afterTime: '',
      } as AnalyticsProto.GetVisitEventsRequest;

      const response: AnalyticsProto.GetVisitEventsResponse = await new Promise(
        (resolve, reject) => {
          analyticsClient.getVisitEventsPaginated(request, (err, response) => {
            if (err) {
              reject(err);
            } else {
              resolve(response);
            }
          });
        },
      );

      expect(response).toBeDefined();
      expect(response.events).toHaveLength(2);
      expect(response.events[0].eventProperties.pageUrl).toBe('/home');
      expect(response.afterId).toBe('visit-2');
    });

    it('should get all visit events with valid parameters', async () => {
      const request = {
        apiKey: 'mock-api-key-123',
        projectName: 'test-project',
        afterTime: '',
        limit: 0,
      } as AnalyticsProto.GetAllVisitEventsRequest;

      const response: AnalyticsProto.GetAllVisitEventsResponse =
        await new Promise((resolve, reject) => {
          analyticsClient.getAllVisitEvents(request, (err, response) => {
            if (err) {
              reject(err);
            } else {
              resolve(response);
            }
          });
        });

      expect(response).toBeDefined();
      expect(response.events).toHaveLength(1);
      expect(response.events[0].eventProperties.pageUrl).toBe('/home');
    });
  });

  describe('Input Events Retrieval', () => {
    it('should get paginated input events with valid parameters', async () => {
      const request = {
        apiKey: 'mock-api-key-123',
        projectName: 'test-project',
        afterId: '',
        environment: 'development',
        limit: 10,
        afterTime: '',
      } as AnalyticsProto.GetInputEventsRequest;

      const response: AnalyticsProto.GetInputEventsResponse = await new Promise(
        (resolve, reject) => {
          analyticsClient.getInputEventsPaginated(request, (err, response) => {
            if (err) {
              reject(err);
            } else {
              resolve(response);
            }
          });
        },
      );

      expect(response).toBeDefined();
      expect(response.events).toHaveLength(1);
      expect(response.events[0].eventProperties.textValue).toBe(
        'analytics query',
      );
      expect(response.afterId).toBe('input-1');
    });

    it('should get all input events with valid parameters', async () => {
      const request = {
        apiKey: 'mock-api-key-123',
        projectName: 'test-project',
        afterTime: '',
        limit: 0,
      } as AnalyticsProto.GetAllInputEventsRequest;

      const response: AnalyticsProto.GetAllInputEventsResponse =
        await new Promise((resolve, reject) => {
          analyticsClient.getAllInputEvents(request, (err, response) => {
            if (err) {
              reject(err);
            } else {
              resolve(response);
            }
          });
        });

      expect(response).toBeDefined();
      expect(response.events).toHaveLength(1);
      expect(response.events[0].eventProperties.textValue).toBe(
        'analytics query',
      );
    });
  });

  describe('Custom Events Retrieval', () => {
    it('should get paginated custom events with valid parameters', async () => {
      const request = {
        apiKey: 'mock-api-key-123',
        projectName: 'test-project',
        category: 'user-action',
        subcategory: 'form-submission',
        afterId: '',
        environment: 'development',
        limit: 10,
        afterTime: '',
      } as AnalyticsProto.GetCustomEventsRequest;

      const response: AnalyticsProto.GetCustomEventsResponse =
        await new Promise((resolve, reject) => {
          analyticsClient.getCustomEventsPaginated(request, (err, response) => {
            if (err) {
              reject(err);
            } else {
              resolve(response);
            }
          });
        });

      expect(response).toBeDefined();
      expect(response.events).toHaveLength(1);
      expect(response.events[0].properties.formType).toBe('contact');
      expect(response.events[0].properties.formId).toBe('contact-form-1');
      expect(response.afterId).toBe('custom-1');
    });

    it('should get all custom events with valid parameters', async () => {
      const request = {
        apiKey: 'mock-api-key-123',
        projectName: 'test-project',
        category: 'user-action',
        subcategory: 'form-submission',
        afterTime: '',
        limit: 0,
      } as AnalyticsProto.GetAllCustomEventsRequest;

      const response: AnalyticsProto.GetAllCustomEventsResponse =
        await new Promise((resolve, reject) => {
          analyticsClient.getAllCustomEvents(request, (err, response) => {
            if (err) {
              reject(err);
            } else {
              resolve(response);
            }
          });
        });

      expect(response).toBeDefined();
      expect(response.events).toHaveLength(1);
      expect(response.events[0].properties.formType).toBe('contact');
    });

    it('should fail to get custom events without required category', async () => {
      const request = {
        apiKey: 'mock-api-key-123',
        projectName: 'test-project',
        category: '',
        subcategory: 'form-submission',
        afterId: '',
        environment: 'development',
        limit: 10,
        afterTime: '',
      };

      try {
        await new Promise((resolve, reject) => {
          analyticsClient.getCustomEventsPaginated(request, (err, response) => {
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

    it('should fail to get custom events without required subcategory', async () => {
      const request = {
        apiKey: 'mock-api-key-123',
        projectName: 'test-project',
        category: 'user-action',
        subcategory: '',
        afterId: '',
        environment: 'development',
        limit: 10,
        afterTime: '',
      };

      try {
        await new Promise((resolve, reject) => {
          analyticsClient.getCustomEventsPaginated(request, (err, response) => {
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

  describe('Authentication and Validation Tests', () => {
    it('should handle authentication errors consistently across all methods', async () => {
      const invalidApiKey = 'invalid-key';
      const methods = [
        'getCustomEventTypes',
        'getCustomGraphTypesById',
        'getClickEventsPaginated',
        'getAllClickEvents',
        'getVisitEventsPaginated',
        'getAllVisitEvents',
        'getInputEventsPaginated',
        'getAllInputEvents',
        'getCustomEventsPaginated',
        'getAllCustomEvents',
      ];

      for (const method of methods) {
        const request = {
          apiKey: invalidApiKey,
          projectName: 'test-project',
          ...(method.includes('Custom') && !method.includes('Type')
            ? {
                category: 'user-action',
                subcategory: 'form-submission',
              }
            : {}),
          ...(method.includes('GraphTypes')
            ? {
                eventTypeId: 'custom-event-type-1',
              }
            : {}),
          ...(method.includes('Paginated')
            ? {
                afterId: '',
                environment: 'development',
                limit: 10,
                afterTime: '',
              }
            : {}),
          ...(method.includes('All') && !method.includes('Custom')
            ? {
                afterTime: '',
                limit: 0,
              }
            : {}),
        };

        try {
          await new Promise((resolve, reject) => {
            analyticsClient[method](request, (err, response) => {
              if (err) {
                reject(err);
              } else {
                resolve(response);
              }
            });
          });
          fail(`Expected error was not thrown for method: ${method}`);
        } catch (err) {
          expect(err).toBeDefined();
        }
      }
    });

    it('should validate required project name across all methods', async () => {
      const methods = [
        'getCustomEventTypes',
        'getCustomGraphTypesById',
        'getClickEventsPaginated',
        'getAllClickEvents',
        'getVisitEventsPaginated',
        'getAllVisitEvents',
        'getInputEventsPaginated',
        'getAllInputEvents',
        'getCustomEventsPaginated',
        'getAllCustomEvents',
      ];

      for (const method of methods) {
        const request = {
          apiKey: 'mock-api-key-123',
          projectName: '', // Empty project name
          ...(method.includes('Custom') && !method.includes('Type')
            ? {
                category: 'user-action',
                subcategory: 'form-submission',
              }
            : {}),
          ...(method.includes('GraphTypes')
            ? {
                eventTypeId: 'custom-event-type-1',
              }
            : {}),
          ...(method.includes('Paginated')
            ? {
                afterId: '',
                environment: 'development',
                limit: 10,
                afterTime: '',
              }
            : {}),
        };

        try {
          await new Promise((resolve, reject) => {
            analyticsClient[method](request, (err, response) => {
              if (err) {
                reject(err);
              } else {
                resolve(response);
              }
            });
          });
          fail(`Expected error was not thrown for method: ${method}`);
        } catch (err) {
          expect(err).toBeDefined();
        }
      }
    });
  });
});
