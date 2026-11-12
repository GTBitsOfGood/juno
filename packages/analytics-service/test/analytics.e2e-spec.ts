import { Test, TestingModule } from '@nestjs/testing';
import { INestMicroservice } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import * as ProtoLoader from '@grpc/proto-loader';
import * as GRPC from '@grpc/grpc-js';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ResetProtoFile, AnalyticsProto, AnalyticsProtoFile } from 'juno-proto';

const { JUNO_ANALYTICS_SERVICE_ANALYTICS_PACKAGE_NAME } = AnalyticsProto;

let app: INestMicroservice;

jest.setTimeout(15000);

async function initApp() {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

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

describe('Analytics Service - Visit Events (Issue #266)', () => {
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

  describe('logVisitEvent', () => {
    it('should log a visit event successfully', async () => {
      const request = {
        configId: 1,
        configEnvironment: 'test',
        environment: 'test',
        pageUrl: 'https://example.com/home',
        userId: 'user-123',
      } as AnalyticsProto.VisitEventRequest;

      const response: AnalyticsProto.VisitEventResponse = await new Promise(
        (resolve, reject) => {
          analyticsClient.logVisitEvent(request, (err, response) => {
            if (err) reject(err);
            else resolve(response);
          });
        },
      );

      expect(response).toBeDefined();
      expect(response.id).toBeDefined();
      expect(response.category).toBe('Activity');
      expect(response.subcategory).toBe('Visit');
      expect(response.environment).toBe('test');
      expect(response.eventProperties).toBeDefined();
      expect(response.eventProperties.pageUrl).toBe('https://example.com/home');
      expect(response.eventProperties.userId).toBe('user-123');
    });

    it('should fail with invalid request - missing userId', async () => {
      const request = {
        configId: 1,
        configEnvironment: 'test',
        environment: 'test',
        pageUrl: 'https://example.com/home',
        userId: '',
      };

      await expect(
        new Promise((resolve, reject) => {
          analyticsClient.logVisitEvent(request, (err, response) => {
            if (err) reject(err);
            else resolve(response);
          });
        }),
      ).rejects.toBeDefined();
    });

    it('should fail with invalid request - missing pageUrl', async () => {
      const request = {
        configId: 1,
        configEnvironment: 'test',
        environment: 'test',
        pageUrl: '',
        userId: 'user-123',
      };

      await expect(
        new Promise((resolve, reject) => {
          analyticsClient.logVisitEvent(request, (err, response) => {
            if (err) reject(err);
            else resolve(response);
          });
        }),
      ).rejects.toBeDefined();
    });
  });

  describe('getVisitEventsPaginated', () => {
    it('should retrieve visit events with pagination', async () => {
      // First, create some visit events
      for (let i = 0; i < 3; i++) {
        await new Promise((resolve, reject) => {
          analyticsClient.logVisitEvent(
            {
              configId: 1,
              configEnvironment: 'test',
              environment: 'test',
              pageUrl: `https://example.com/page-${i}`,
              userId: `user-${i}`,
            },
            (err, response) => {
              if (err) reject(err);
              else resolve(response);
            },
          );
        });
      }

      // Get paginated events
      const request = {
        projectName: 'test-project',
        configId: 1,
        configEnvironment: 'test',
        environment: 'test',
        limit: 2,
      } as AnalyticsProto.GetVisitEventsRequest;

      const response: AnalyticsProto.GetVisitEventsResponse = await new Promise(
        (resolve, reject) => {
          analyticsClient.getVisitEventsPaginated(request, (err, response) => {
            if (err) reject(err);
            else resolve(response);
          });
        },
      );

      expect(response).toBeDefined();
      expect(response.events).toBeDefined();
      expect(response.events.length).toBeLessThanOrEqual(2);
      expect(response.afterId).toBeDefined();

      // Each event should have proper structure
      response.events.forEach((event) => {
        expect(event.id).toBeDefined();
        expect(event.category).toBe('Activity');
        expect(event.subcategory).toBe('Visit');
        expect(event.eventProperties).toBeDefined();
        expect(event.eventProperties.pageUrl).toBeDefined();
        expect(event.eventProperties.userId).toBeDefined();
      });
    });

    it('should support pagination with afterId cursor', async () => {
      // Create multiple events
      for (let i = 0; i < 5; i++) {
        await new Promise((resolve, reject) => {
          analyticsClient.logVisitEvent(
            {
              configId: 2,
              configEnvironment: 'test',
              environment: 'test',
              pageUrl: `https://example.com/pagination-test-${i}`,
              userId: `pagination-user-${i}`,
            },
            (err, response) => {
              if (err) reject(err);
              else resolve(response);
            },
          );
        });
      }

      // Get first page
      const firstPage: AnalyticsProto.GetVisitEventsResponse =
        await new Promise((resolve, reject) => {
          analyticsClient.getVisitEventsPaginated(
            {
              projectName: 'test-project',
              configId: 2,
              configEnvironment: 'test',
              environment: 'test',
              limit: 2,
            },
            (err, response) => {
              if (err) reject(err);
              else resolve(response);
            },
          );
        });

      expect(firstPage.events.length).toBe(2);
      expect(firstPage.afterId).toBeDefined();

      // Get second page using afterId
      const secondPage: AnalyticsProto.GetVisitEventsResponse =
        await new Promise((resolve, reject) => {
          analyticsClient.getVisitEventsPaginated(
            {
              projectName: 'test-project',
              configId: 2,
              configEnvironment: 'test',
              environment: 'test',
              limit: 2,
              afterId: firstPage.afterId,
            },
            (err, response) => {
              if (err) reject(err);
              else resolve(response);
            },
          );
        });

      expect(secondPage.events.length).toBe(2);
      // Ensure second page events are different from first page
      const firstPageIds = firstPage.events.map((e) => e.id);
      const secondPageIds = secondPage.events.map((e) => e.id);
      secondPageIds.forEach((id) => {
        expect(firstPageIds).not.toContain(id);
      });
    });

    it('should fail with missing projectName', async () => {
      const request = {
        projectName: '',
        configId: 1,
        configEnvironment: 'test',
        environment: 'test',
      };

      await expect(
        new Promise((resolve, reject) => {
          analyticsClient.getVisitEventsPaginated(request, (err, response) => {
            if (err) reject(err);
            else resolve(response);
          });
        }),
      ).rejects.toBeDefined();
    });
  });

  describe('getAllVisitEvents', () => {
    it('should retrieve all visit events for a project', async () => {
      // Create some events for a specific project
      for (let i = 0; i < 3; i++) {
        await new Promise((resolve, reject) => {
          analyticsClient.logVisitEvent(
            {
              configId: 3,
              configEnvironment: 'test',
              environment: 'test',
              pageUrl: `https://example.com/all-events-test-${i}`,
              userId: `all-events-user-${i}`,
            },
            (err, response) => {
              if (err) reject(err);
              else resolve(response);
            },
          );
        });
      }

      const request = {
        projectName: 'test-project',
        configId: 3,
        configEnvironment: 'test',
        limit: 100,
      } as AnalyticsProto.GetAllVisitEventsRequest;

      const response: AnalyticsProto.GetAllVisitEventsResponse =
        await new Promise((resolve, reject) => {
          analyticsClient.getAllVisitEvents(request, (err, response) => {
            if (err) reject(err);
            else resolve(response);
          });
        });

      expect(response).toBeDefined();
      expect(response.events).toBeDefined();
      expect(response.events.length).toBeGreaterThanOrEqual(3);

      response.events.forEach((event) => {
        expect(event.category).toBe('Activity');
        expect(event.subcategory).toBe('Visit');
        expect(event.eventProperties).toBeDefined();
      });
    });

    it('should fail with missing projectName', async () => {
      const request = {
        projectName: '',
        configId: 1,
        configEnvironment: 'test',
      };

      await expect(
        new Promise((resolve, reject) => {
          analyticsClient.getAllVisitEvents(request, (err, response) => {
            if (err) reject(err);
            else resolve(response);
          });
        }),
      ).rejects.toBeDefined();
    });
  });

  describe('Project isolation', () => {
    it('should not return events from other projects', async () => {
      // Create events for project 10
      await new Promise((resolve, reject) => {
        analyticsClient.logVisitEvent(
          {
            configId: 10,
            configEnvironment: 'test',
            environment: 'test',
            pageUrl: 'https://project10.com/page',
            userId: 'project10-user',
          },
          (err, response) => {
            if (err) reject(err);
            else resolve(response);
          },
        );
      });

      // Create events for project 20
      await new Promise((resolve, reject) => {
        analyticsClient.logVisitEvent(
          {
            configId: 20,
            configEnvironment: 'test',
            environment: 'test',
            pageUrl: 'https://project20.com/page',
            userId: 'project20-user',
          },
          (err, response) => {
            if (err) reject(err);
            else resolve(response);
          },
        );
      });

      // Fetch events for project 10 only
      const response: AnalyticsProto.GetVisitEventsResponse = await new Promise(
        (resolve, reject) => {
          analyticsClient.getVisitEventsPaginated(
            {
              projectName: 'project-10',
              configId: 10,
              configEnvironment: 'test',
              environment: 'test',
              limit: 100,
            },
            (err, response) => {
              if (err) reject(err);
              else resolve(response);
            },
          );
        },
      );

      // All returned events should be from project 10
      response.events.forEach((event) => {
        expect(event.projectId).toBe('10');
      });
    });
  });
});

describe('Analytics Service - Stubbed Methods (Return UNIMPLEMENTED)', () => {
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

  it('logClickEvent should return UNIMPLEMENTED', async () => {
    try {
      await new Promise((resolve, reject) => {
        analyticsClient.logClickEvent(
          {
            configId: 1,
            configEnvironment: 'test',
            objectId: 'button-1',
            userId: 'user-123',
          },
          (err, response) => {
            if (err) reject(err);
            else resolve(response);
          },
        );
      });
      fail('Expected UNIMPLEMENTED error');
    } catch (err: any) {
      expect(err.code).toBe(12); // UNIMPLEMENTED
    }
  });

  it('logInputEvent should return UNIMPLEMENTED', async () => {
    try {
      await new Promise((resolve, reject) => {
        analyticsClient.logInputEvent(
          {
            configId: 1,
            configEnvironment: 'test',
            objectId: 'input-1',
            userId: 'user-123',
            textValue: 'test',
          },
          (err, response) => {
            if (err) reject(err);
            else resolve(response);
          },
        );
      });
      fail('Expected UNIMPLEMENTED error');
    } catch (err: any) {
      expect(err.code).toBe(12); // UNIMPLEMENTED
    }
  });

  it('logCustomEvent should return UNIMPLEMENTED', async () => {
    try {
      await new Promise((resolve, reject) => {
        analyticsClient.logCustomEvent(
          {
            configId: 1,
            configEnvironment: 'test',
            category: 'test',
            subcategory: 'test',
            properties: { key: 'value' },
          },
          (err, response) => {
            if (err) reject(err);
            else resolve(response);
          },
        );
      });
      fail('Expected UNIMPLEMENTED error');
    } catch (err: any) {
      expect(err.code).toBe(12); // UNIMPLEMENTED
    }
  });

  it('getCustomEventTypes should return empty list (not crash)', async () => {
    const response = await new Promise((resolve, reject) => {
      analyticsClient.getCustomEventTypes(
        {
          projectName: 'test-project',
          configId: 1,
          configEnvironment: 'test',
        },
        (err, response) => {
          if (err) reject(err);
          else resolve(response);
        },
      );
    });

    expect(response).toBeDefined();
    expect((response as any).eventTypes ?? []).toEqual([]);
  });

  it('getCustomGraphTypesById should return empty list (not crash)', async () => {
    const response = await new Promise((resolve, reject) => {
      analyticsClient.getCustomGraphTypesById(
        {
          projectName: 'test-project',
          eventTypeId: 'some-type',
          configId: 1,
          configEnvironment: 'test',
        },
        (err, response) => {
          if (err) reject(err);
          else resolve(response);
        },
      );
    });

    expect(response).toBeDefined();
    expect((response as any).graphs ?? []).toEqual([]);
  });
});
