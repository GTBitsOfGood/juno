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

describe('Analytics Service - Click Events (#263)', () => {
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

  describe('logClickEvent', () => {
    it('should log a click event and return the full response shape', async () => {
      const response: AnalyticsProto.ClickEventResponse = await new Promise(
        (resolve, reject) => {
          analyticsClient.logClickEvent(
            {
              configId: 101,
              configEnvironment: 'test',
              environment: 'test',
              objectId: 'button-0',
              userId: 'user-0',
            },
            (err, response) => {
              if (err) reject(err);
              else resolve(response);
            },
          );
        },
      );

      expect(response.id).toBeTruthy();
      expect(response.category).toBe('Interaction');
      expect(response.subcategory).toBe('Click');
      expect(response.projectId).toBe('101');
      expect(response.environment).toBe('test');
      expect(response.createdAt).toBeTruthy();
      expect(response.updatedAt).toBeTruthy();
      expect(response.eventProperties).toEqual({
        objectId: 'button-0',
        userId: 'user-0',
      });
    });

    it('should fail with invalid request - missing objectId', async () => {
      const request = {
        configId: 102,
        configEnvironment: 'test',
        environment: 'test',
        objectId: '',
        userId: 'user-1',
      };

      await expect(
        new Promise((resolve, reject) => {
          analyticsClient.logClickEvent(request, (err, response) => {
            if (err) reject(err);
            else resolve(response);
          });
        }),
      ).rejects.toMatchObject({ code: GRPC.status.INVALID_ARGUMENT });
    });
  });

  describe('getClickEventsPaginated', () => {
    it('should respect limit and return newest events first', async () => {
      // Create 5 events
      const created: any[] = [];
      for (let i = 0; i < 5; i++) {
        created.push(
          await new Promise((resolve, reject) => {
            analyticsClient.logClickEvent(
              {
                configId: 103,
                configEnvironment: 'test',
                environment: 'test',
                objectId: `button-${i}`,
                userId: `user-${i}`,
              },
              (err, response) => {
                if (err) reject(err);
                else resolve(response);
              },
            );
          }),
        );
      }

      const response: AnalyticsProto.GetClickEventsResponse = await new Promise(
        (resolve, reject) => {
          analyticsClient.getClickEventsPaginated(
            {
              projectName: 'project-103',
              configId: 103,
              configEnvironment: 'test',
              environment: 'test',
              limit: 2,
            },
            (err, response) => {
              if (err) reject(err);
              else resolve(response);
            },
          );
        },
      );

      expect(response.events).toHaveLength(2);
      expect(response.events.map((e) => e.id)).toEqual([
        created[4].id,
        created[3].id,
      ]);
      expect(typeof response.afterId).toBe('string');
      response.events.forEach((event) => {
        expect(event.category).toBe('Interaction');
        expect(event.subcategory).toBe('Click');
      });
    });

    it('should page through every event with the afterId cursor and no duplicates', async () => {
      // Create 5 events
      const created: any[] = [];
      for (let i = 0; i < 5; i++) {
        created.push(
          await new Promise((resolve, reject) => {
            analyticsClient.logClickEvent(
              {
                configId: 104,
                configEnvironment: 'test',
                environment: 'test',
                objectId: `button-${i}`,
                userId: `user-${i}`,
              },
              (err, response) => {
                if (err) reject(err);
                else resolve(response);
              },
            );
          }),
        );
      }

      // Get first page
      const firstPage: AnalyticsProto.GetClickEventsResponse =
        await new Promise((resolve, reject) => {
          analyticsClient.getClickEventsPaginated(
            {
              projectName: 'project-104',
              configId: 104,
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

      // Get second page using afterId
      const secondPage: AnalyticsProto.GetClickEventsResponse =
        await new Promise((resolve, reject) => {
          analyticsClient.getClickEventsPaginated(
            {
              projectName: 'project-104',
              configId: 104,
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

      // Get third page using afterId
      const thirdPage: AnalyticsProto.GetClickEventsResponse =
        await new Promise((resolve, reject) => {
          analyticsClient.getClickEventsPaginated(
            {
              projectName: 'project-104',
              configId: 104,
              configEnvironment: 'test',
              environment: 'test',
              limit: 2,
              afterId: secondPage.afterId,
            },
            (err, response) => {
              if (err) reject(err);
              else resolve(response);
            },
          );
        });

      expect(firstPage.events).toHaveLength(2);
      expect(secondPage.events).toHaveLength(2);
      expect(thirdPage.events ?? []).toHaveLength(1);

      const seenIds = [
        ...firstPage.events,
        ...secondPage.events,
        ...(thirdPage.events ?? []),
      ].map((e) => e.id);
      expect(new Set(seenIds).size).toBe(5);
      expect(seenIds.sort()).toEqual(created.map((e) => e.id).sort());
    });

    it('should only return events at or after afterTime', async () => {
      // Create 2 earlier events
      for (let i = 0; i < 2; i++) {
        await new Promise((resolve, reject) => {
          analyticsClient.logClickEvent(
            {
              configId: 105,
              configEnvironment: 'test',
              environment: 'test',
              objectId: `button-${i}`,
              userId: `user-${i}`,
            },
            (err, response) => {
              if (err) reject(err);
              else resolve(response);
            },
          );
        });
      }

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Create 2 later events
      const later: any[] = [];
      for (let i = 0; i < 2; i++) {
        later.push(
          await new Promise((resolve, reject) => {
            analyticsClient.logClickEvent(
              {
                configId: 105,
                configEnvironment: 'test',
                environment: 'test',
                objectId: `button-${i + 2}`,
                userId: `user-${i + 2}`,
              },
              (err, response) => {
                if (err) reject(err);
                else resolve(response);
              },
            );
          }),
        );
      }

      const response: AnalyticsProto.GetClickEventsResponse = await new Promise(
        (resolve, reject) => {
          analyticsClient.getClickEventsPaginated(
            {
              projectName: 'project-105',
              configId: 105,
              configEnvironment: 'test',
              environment: 'test',
              limit: 10,
              afterTime: later[0].createdAt,
            },
            (err, response) => {
              if (err) reject(err);
              else resolve(response);
            },
          );
        },
      );

      expect((response.events ?? []).map((e) => e.id).sort()).toEqual(
        later.map((e) => e.id).sort(),
      );
    });
  });

  describe('getAllClickEvents', () => {
    it('should retrieve all click events for a project', async () => {
      // Create 3 events
      const created: any[] = [];
      for (let i = 0; i < 3; i++) {
        created.push(
          await new Promise((resolve, reject) => {
            analyticsClient.logClickEvent(
              {
                configId: 106,
                configEnvironment: 'test',
                environment: 'test',
                objectId: `button-${i}`,
                userId: `user-${i}`,
              },
              (err, response) => {
                if (err) reject(err);
                else resolve(response);
              },
            );
          }),
        );
      }

      const response: AnalyticsProto.GetAllClickEventsResponse =
        await new Promise((resolve, reject) => {
          analyticsClient.getAllClickEvents(
            {
              projectName: 'project-106',
              configId: 106,
              configEnvironment: 'test',
              limit: 1000,
            },
            (err, response) => {
              if (err) reject(err);
              else resolve(response);
            },
          );
        });

      expect(response.events.map((e) => e.id).sort()).toEqual(
        created.map((e) => e.id).sort(),
      );
      response.events.forEach((event) => {
        expect(event.category).toBe('Interaction');
        expect(event.subcategory).toBe('Click');
        expect(event.eventProperties).toBeDefined();
      });
    });

    it('should fail with missing projectName (paginated and all)', async () => {
      await expect(
        new Promise((resolve, reject) => {
          analyticsClient.getClickEventsPaginated(
            {
              projectName: '',
              configId: 109,
              configEnvironment: 'test',
              environment: 'test',
            },
            (err, response) => {
              if (err) reject(err);
              else resolve(response);
            },
          );
        }),
      ).rejects.toMatchObject({ code: GRPC.status.INVALID_ARGUMENT });

      await expect(
        new Promise((resolve, reject) => {
          analyticsClient.getAllClickEvents(
            {
              projectName: '',
              configId: 109,
              configEnvironment: 'test',
            },
            (err, response) => {
              if (err) reject(err);
              else resolve(response);
            },
          );
        }),
      ).rejects.toMatchObject({ code: GRPC.status.INVALID_ARGUMENT });
    });
  });

  describe('Project isolation', () => {
    it('should not return events from other projects (paginated or all)', async () => {
      // Create 2 events for project 107
      const createdA: any[] = [];
      for (let i = 0; i < 2; i++) {
        createdA.push(
          await new Promise((resolve, reject) => {
            analyticsClient.logClickEvent(
              {
                configId: 107,
                configEnvironment: 'test',
                environment: 'test',
                objectId: `button-${i}`,
                userId: `user-${i}`,
              },
              (err, response) => {
                if (err) reject(err);
                else resolve(response);
              },
            );
          }),
        );
      }

      // Create 3 events for project 108
      for (let i = 0; i < 3; i++) {
        await new Promise((resolve, reject) => {
          analyticsClient.logClickEvent(
            {
              configId: 108,
              configEnvironment: 'test',
              environment: 'test',
              objectId: `button-${i}`,
              userId: `user-${i}`,
            },
            (err, response) => {
              if (err) reject(err);
              else resolve(response);
            },
          );
        });
      }

      // Fetch events for project 107 only
      const page: AnalyticsProto.GetClickEventsResponse = await new Promise(
        (resolve, reject) => {
          analyticsClient.getClickEventsPaginated(
            {
              projectName: 'project-107',
              configId: 107,
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

      const all: AnalyticsProto.GetAllClickEventsResponse = await new Promise(
        (resolve, reject) => {
          analyticsClient.getAllClickEvents(
            {
              projectName: 'project-107',
              configId: 107,
              configEnvironment: 'test',
              limit: 1000,
            },
            (err, response) => {
              if (err) reject(err);
              else resolve(response);
            },
          );
        },
      );

      const expectedIds = createdA.map((e) => e.id).sort();
      expect(page.events.map((e) => e.id).sort()).toEqual(expectedIds);
      expect(all.events.map((e) => e.id).sort()).toEqual(expectedIds);
      [...page.events, ...all.events].forEach((event) => {
        expect(event.projectId).toBe('107');
      });
    });
  });
});

describe('Analytics Service - Input Events (#263)', () => {
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

  describe('logInputEvent', () => {
    it('should log a input event and return the full response shape', async () => {
      const response: AnalyticsProto.InputEventResponse = await new Promise(
        (resolve, reject) => {
          analyticsClient.logInputEvent(
            {
              configId: 201,
              configEnvironment: 'test',
              environment: 'test',
              objectId: 'input-0',
              userId: 'user-0',
              textValue: 'text-0',
            },
            (err, response) => {
              if (err) reject(err);
              else resolve(response);
            },
          );
        },
      );

      expect(response.id).toBeTruthy();
      expect(response.category).toBe('Interaction');
      expect(response.subcategory).toBe('Input');
      expect(response.projectId).toBe('201');
      expect(response.environment).toBe('test');
      expect(response.createdAt).toBeTruthy();
      expect(response.updatedAt).toBeTruthy();
      expect(response.eventProperties).toEqual({
        objectId: 'input-0',
        userId: 'user-0',
        textValue: 'text-0',
      });
    });

    it('should fail with invalid request - missing textValue', async () => {
      const request = {
        configId: 202,
        configEnvironment: 'test',
        environment: 'test',
        objectId: 'input-1',
        userId: 'user-1',
        textValue: '',
      };

      await expect(
        new Promise((resolve, reject) => {
          analyticsClient.logInputEvent(request, (err, response) => {
            if (err) reject(err);
            else resolve(response);
          });
        }),
      ).rejects.toMatchObject({ code: GRPC.status.INVALID_ARGUMENT });
    });
  });

  describe('getInputEventsPaginated', () => {
    it('should respect limit and return newest events first', async () => {
      // Create 5 events
      const created: any[] = [];
      for (let i = 0; i < 5; i++) {
        created.push(
          await new Promise((resolve, reject) => {
            analyticsClient.logInputEvent(
              {
                configId: 203,
                configEnvironment: 'test',
                environment: 'test',
                objectId: `input-${i}`,
                userId: `user-${i}`,
                textValue: `text-${i}`,
              },
              (err, response) => {
                if (err) reject(err);
                else resolve(response);
              },
            );
          }),
        );
      }

      const response: AnalyticsProto.GetInputEventsResponse = await new Promise(
        (resolve, reject) => {
          analyticsClient.getInputEventsPaginated(
            {
              projectName: 'project-203',
              configId: 203,
              configEnvironment: 'test',
              environment: 'test',
              limit: 2,
            },
            (err, response) => {
              if (err) reject(err);
              else resolve(response);
            },
          );
        },
      );

      expect(response.events).toHaveLength(2);
      expect(response.events.map((e) => e.id)).toEqual([
        created[4].id,
        created[3].id,
      ]);
      expect(typeof response.afterId).toBe('string');
      response.events.forEach((event) => {
        expect(event.category).toBe('Interaction');
        expect(event.subcategory).toBe('Input');
      });
    });

    it('should page through every event with the afterId cursor and no duplicates', async () => {
      // Create 5 events
      const created: any[] = [];
      for (let i = 0; i < 5; i++) {
        created.push(
          await new Promise((resolve, reject) => {
            analyticsClient.logInputEvent(
              {
                configId: 204,
                configEnvironment: 'test',
                environment: 'test',
                objectId: `input-${i}`,
                userId: `user-${i}`,
                textValue: `text-${i}`,
              },
              (err, response) => {
                if (err) reject(err);
                else resolve(response);
              },
            );
          }),
        );
      }

      // Get first page
      const firstPage: AnalyticsProto.GetInputEventsResponse =
        await new Promise((resolve, reject) => {
          analyticsClient.getInputEventsPaginated(
            {
              projectName: 'project-204',
              configId: 204,
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

      // Get second page using afterId
      const secondPage: AnalyticsProto.GetInputEventsResponse =
        await new Promise((resolve, reject) => {
          analyticsClient.getInputEventsPaginated(
            {
              projectName: 'project-204',
              configId: 204,
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

      // Get third page using afterId
      const thirdPage: AnalyticsProto.GetInputEventsResponse =
        await new Promise((resolve, reject) => {
          analyticsClient.getInputEventsPaginated(
            {
              projectName: 'project-204',
              configId: 204,
              configEnvironment: 'test',
              environment: 'test',
              limit: 2,
              afterId: secondPage.afterId,
            },
            (err, response) => {
              if (err) reject(err);
              else resolve(response);
            },
          );
        });

      expect(firstPage.events).toHaveLength(2);
      expect(secondPage.events).toHaveLength(2);
      expect(thirdPage.events ?? []).toHaveLength(1);

      const seenIds = [
        ...firstPage.events,
        ...secondPage.events,
        ...(thirdPage.events ?? []),
      ].map((e) => e.id);
      expect(new Set(seenIds).size).toBe(5);
      expect(seenIds.sort()).toEqual(created.map((e) => e.id).sort());
    });

    it('should only return events at or after afterTime', async () => {
      // Create 2 earlier events
      for (let i = 0; i < 2; i++) {
        await new Promise((resolve, reject) => {
          analyticsClient.logInputEvent(
            {
              configId: 205,
              configEnvironment: 'test',
              environment: 'test',
              objectId: `input-${i}`,
              userId: `user-${i}`,
              textValue: `text-${i}`,
            },
            (err, response) => {
              if (err) reject(err);
              else resolve(response);
            },
          );
        });
      }

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Create 2 later events
      const later: any[] = [];
      for (let i = 0; i < 2; i++) {
        later.push(
          await new Promise((resolve, reject) => {
            analyticsClient.logInputEvent(
              {
                configId: 205,
                configEnvironment: 'test',
                environment: 'test',
                objectId: `input-${i + 2}`,
                userId: `user-${i + 2}`,
                textValue: `text-${i + 2}`,
              },
              (err, response) => {
                if (err) reject(err);
                else resolve(response);
              },
            );
          }),
        );
      }

      const response: AnalyticsProto.GetInputEventsResponse = await new Promise(
        (resolve, reject) => {
          analyticsClient.getInputEventsPaginated(
            {
              projectName: 'project-205',
              configId: 205,
              configEnvironment: 'test',
              environment: 'test',
              limit: 10,
              afterTime: later[0].createdAt,
            },
            (err, response) => {
              if (err) reject(err);
              else resolve(response);
            },
          );
        },
      );

      expect((response.events ?? []).map((e) => e.id).sort()).toEqual(
        later.map((e) => e.id).sort(),
      );
    });
  });

  describe('getAllInputEvents', () => {
    it('should retrieve all input events for a project', async () => {
      // Create 3 events
      const created: any[] = [];
      for (let i = 0; i < 3; i++) {
        created.push(
          await new Promise((resolve, reject) => {
            analyticsClient.logInputEvent(
              {
                configId: 206,
                configEnvironment: 'test',
                environment: 'test',
                objectId: `input-${i}`,
                userId: `user-${i}`,
                textValue: `text-${i}`,
              },
              (err, response) => {
                if (err) reject(err);
                else resolve(response);
              },
            );
          }),
        );
      }

      const response: AnalyticsProto.GetAllInputEventsResponse =
        await new Promise((resolve, reject) => {
          analyticsClient.getAllInputEvents(
            {
              projectName: 'project-206',
              configId: 206,
              configEnvironment: 'test',
              limit: 1000,
            },
            (err, response) => {
              if (err) reject(err);
              else resolve(response);
            },
          );
        });

      expect(response.events.map((e) => e.id).sort()).toEqual(
        created.map((e) => e.id).sort(),
      );
      response.events.forEach((event) => {
        expect(event.category).toBe('Interaction');
        expect(event.subcategory).toBe('Input');
        expect(event.eventProperties).toBeDefined();
      });
    });

    it('should fail with missing projectName (paginated and all)', async () => {
      await expect(
        new Promise((resolve, reject) => {
          analyticsClient.getInputEventsPaginated(
            {
              projectName: '',
              configId: 209,
              configEnvironment: 'test',
              environment: 'test',
            },
            (err, response) => {
              if (err) reject(err);
              else resolve(response);
            },
          );
        }),
      ).rejects.toMatchObject({ code: GRPC.status.INVALID_ARGUMENT });

      await expect(
        new Promise((resolve, reject) => {
          analyticsClient.getAllInputEvents(
            {
              projectName: '',
              configId: 209,
              configEnvironment: 'test',
            },
            (err, response) => {
              if (err) reject(err);
              else resolve(response);
            },
          );
        }),
      ).rejects.toMatchObject({ code: GRPC.status.INVALID_ARGUMENT });
    });
  });

  describe('Project isolation', () => {
    it('should not return events from other projects (paginated or all)', async () => {
      // Create 2 events for project 207
      const createdA: any[] = [];
      for (let i = 0; i < 2; i++) {
        createdA.push(
          await new Promise((resolve, reject) => {
            analyticsClient.logInputEvent(
              {
                configId: 207,
                configEnvironment: 'test',
                environment: 'test',
                objectId: `input-${i}`,
                userId: `user-${i}`,
                textValue: `text-${i}`,
              },
              (err, response) => {
                if (err) reject(err);
                else resolve(response);
              },
            );
          }),
        );
      }

      // Create 3 events for project 208
      for (let i = 0; i < 3; i++) {
        await new Promise((resolve, reject) => {
          analyticsClient.logInputEvent(
            {
              configId: 208,
              configEnvironment: 'test',
              environment: 'test',
              objectId: `input-${i}`,
              userId: `user-${i}`,
              textValue: `text-${i}`,
            },
            (err, response) => {
              if (err) reject(err);
              else resolve(response);
            },
          );
        });
      }

      // Fetch events for project 207 only
      const page: AnalyticsProto.GetInputEventsResponse = await new Promise(
        (resolve, reject) => {
          analyticsClient.getInputEventsPaginated(
            {
              projectName: 'project-207',
              configId: 207,
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

      const all: AnalyticsProto.GetAllInputEventsResponse = await new Promise(
        (resolve, reject) => {
          analyticsClient.getAllInputEvents(
            {
              projectName: 'project-207',
              configId: 207,
              configEnvironment: 'test',
              limit: 1000,
            },
            (err, response) => {
              if (err) reject(err);
              else resolve(response);
            },
          );
        },
      );

      const expectedIds = createdA.map((e) => e.id).sort();
      expect(page.events.map((e) => e.id).sort()).toEqual(expectedIds);
      expect(all.events.map((e) => e.id).sort()).toEqual(expectedIds);
      [...page.events, ...all.events].forEach((event) => {
        expect(event.projectId).toBe('207');
      });
    });
  });
});

describe('Analytics Service - Visit Events (#263)', () => {
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
    it('should log a visit event and return the full response shape', async () => {
      const response: AnalyticsProto.VisitEventResponse = await new Promise(
        (resolve, reject) => {
          analyticsClient.logVisitEvent(
            {
              configId: 301,
              configEnvironment: 'test',
              environment: 'test',
              pageUrl: 'https://example.com/page-0',
              userId: 'user-0',
            },
            (err, response) => {
              if (err) reject(err);
              else resolve(response);
            },
          );
        },
      );

      expect(response.id).toBeTruthy();
      expect(response.category).toBe('Activity');
      expect(response.subcategory).toBe('Visit');
      expect(response.projectId).toBe('301');
      expect(response.environment).toBe('test');
      expect(response.createdAt).toBeTruthy();
      expect(response.updatedAt).toBeTruthy();
      expect(response.eventProperties).toEqual({
        pageUrl: 'https://example.com/page-0',
        userId: 'user-0',
      });
    });

    it('should fail with invalid request - missing pageUrl', async () => {
      const request = {
        configId: 302,
        configEnvironment: 'test',
        environment: 'test',
        pageUrl: '',
        userId: 'user-1',
      };

      await expect(
        new Promise((resolve, reject) => {
          analyticsClient.logVisitEvent(request, (err, response) => {
            if (err) reject(err);
            else resolve(response);
          });
        }),
      ).rejects.toMatchObject({ code: GRPC.status.INVALID_ARGUMENT });
    });
  });

  describe('getVisitEventsPaginated', () => {
    it('should respect limit and return newest events first', async () => {
      // Create 5 events
      const created: any[] = [];
      for (let i = 0; i < 5; i++) {
        created.push(
          await new Promise((resolve, reject) => {
            analyticsClient.logVisitEvent(
              {
                configId: 303,
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
          }),
        );
      }

      const response: AnalyticsProto.GetVisitEventsResponse = await new Promise(
        (resolve, reject) => {
          analyticsClient.getVisitEventsPaginated(
            {
              projectName: 'project-303',
              configId: 303,
              configEnvironment: 'test',
              environment: 'test',
              limit: 2,
            },
            (err, response) => {
              if (err) reject(err);
              else resolve(response);
            },
          );
        },
      );

      expect(response.events).toHaveLength(2);
      expect(response.events.map((e) => e.id)).toEqual([
        created[4].id,
        created[3].id,
      ]);
      expect(typeof response.afterId).toBe('string');
      response.events.forEach((event) => {
        expect(event.category).toBe('Activity');
        expect(event.subcategory).toBe('Visit');
      });
    });

    it('should page through every event with the afterId cursor and no duplicates', async () => {
      // Create 5 events
      const created: any[] = [];
      for (let i = 0; i < 5; i++) {
        created.push(
          await new Promise((resolve, reject) => {
            analyticsClient.logVisitEvent(
              {
                configId: 304,
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
          }),
        );
      }

      // Get first page
      const firstPage: AnalyticsProto.GetVisitEventsResponse =
        await new Promise((resolve, reject) => {
          analyticsClient.getVisitEventsPaginated(
            {
              projectName: 'project-304',
              configId: 304,
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

      // Get second page using afterId
      const secondPage: AnalyticsProto.GetVisitEventsResponse =
        await new Promise((resolve, reject) => {
          analyticsClient.getVisitEventsPaginated(
            {
              projectName: 'project-304',
              configId: 304,
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

      // Get third page using afterId
      const thirdPage: AnalyticsProto.GetVisitEventsResponse =
        await new Promise((resolve, reject) => {
          analyticsClient.getVisitEventsPaginated(
            {
              projectName: 'project-304',
              configId: 304,
              configEnvironment: 'test',
              environment: 'test',
              limit: 2,
              afterId: secondPage.afterId,
            },
            (err, response) => {
              if (err) reject(err);
              else resolve(response);
            },
          );
        });

      expect(firstPage.events).toHaveLength(2);
      expect(secondPage.events).toHaveLength(2);
      expect(thirdPage.events ?? []).toHaveLength(1);

      const seenIds = [
        ...firstPage.events,
        ...secondPage.events,
        ...(thirdPage.events ?? []),
      ].map((e) => e.id);
      expect(new Set(seenIds).size).toBe(5);
      expect(seenIds.sort()).toEqual(created.map((e) => e.id).sort());
    });

    it('should only return events at or after afterTime', async () => {
      // Create 2 earlier events
      for (let i = 0; i < 2; i++) {
        await new Promise((resolve, reject) => {
          analyticsClient.logVisitEvent(
            {
              configId: 305,
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

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Create 2 later events
      const later: any[] = [];
      for (let i = 0; i < 2; i++) {
        later.push(
          await new Promise((resolve, reject) => {
            analyticsClient.logVisitEvent(
              {
                configId: 305,
                configEnvironment: 'test',
                environment: 'test',
                pageUrl: `https://example.com/page-${i + 2}`,
                userId: `user-${i + 2}`,
              },
              (err, response) => {
                if (err) reject(err);
                else resolve(response);
              },
            );
          }),
        );
      }

      const response: AnalyticsProto.GetVisitEventsResponse = await new Promise(
        (resolve, reject) => {
          analyticsClient.getVisitEventsPaginated(
            {
              projectName: 'project-305',
              configId: 305,
              configEnvironment: 'test',
              environment: 'test',
              limit: 10,
              afterTime: later[0].createdAt,
            },
            (err, response) => {
              if (err) reject(err);
              else resolve(response);
            },
          );
        },
      );

      expect((response.events ?? []).map((e) => e.id).sort()).toEqual(
        later.map((e) => e.id).sort(),
      );
    });
  });

  describe('getAllVisitEvents', () => {
    it('should retrieve all visit events for a project', async () => {
      // Create 3 events
      const created: any[] = [];
      for (let i = 0; i < 3; i++) {
        created.push(
          await new Promise((resolve, reject) => {
            analyticsClient.logVisitEvent(
              {
                configId: 306,
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
          }),
        );
      }

      const response: AnalyticsProto.GetAllVisitEventsResponse =
        await new Promise((resolve, reject) => {
          analyticsClient.getAllVisitEvents(
            {
              projectName: 'project-306',
              configId: 306,
              configEnvironment: 'test',
              limit: 1000,
            },
            (err, response) => {
              if (err) reject(err);
              else resolve(response);
            },
          );
        });

      expect(response.events.map((e) => e.id).sort()).toEqual(
        created.map((e) => e.id).sort(),
      );
      response.events.forEach((event) => {
        expect(event.category).toBe('Activity');
        expect(event.subcategory).toBe('Visit');
        expect(event.eventProperties).toBeDefined();
      });
    });

    it('should fail with missing projectName (paginated and all)', async () => {
      await expect(
        new Promise((resolve, reject) => {
          analyticsClient.getVisitEventsPaginated(
            {
              projectName: '',
              configId: 309,
              configEnvironment: 'test',
              environment: 'test',
            },
            (err, response) => {
              if (err) reject(err);
              else resolve(response);
            },
          );
        }),
      ).rejects.toMatchObject({ code: GRPC.status.INVALID_ARGUMENT });

      await expect(
        new Promise((resolve, reject) => {
          analyticsClient.getAllVisitEvents(
            {
              projectName: '',
              configId: 309,
              configEnvironment: 'test',
            },
            (err, response) => {
              if (err) reject(err);
              else resolve(response);
            },
          );
        }),
      ).rejects.toMatchObject({ code: GRPC.status.INVALID_ARGUMENT });
    });
  });

  describe('Project isolation', () => {
    it('should not return events from other projects (paginated or all)', async () => {
      // Create 2 events for project 307
      const createdA: any[] = [];
      for (let i = 0; i < 2; i++) {
        createdA.push(
          await new Promise((resolve, reject) => {
            analyticsClient.logVisitEvent(
              {
                configId: 307,
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
          }),
        );
      }

      // Create 3 events for project 308
      for (let i = 0; i < 3; i++) {
        await new Promise((resolve, reject) => {
          analyticsClient.logVisitEvent(
            {
              configId: 308,
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

      // Fetch events for project 307 only
      const page: AnalyticsProto.GetVisitEventsResponse = await new Promise(
        (resolve, reject) => {
          analyticsClient.getVisitEventsPaginated(
            {
              projectName: 'project-307',
              configId: 307,
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

      const all: AnalyticsProto.GetAllVisitEventsResponse = await new Promise(
        (resolve, reject) => {
          analyticsClient.getAllVisitEvents(
            {
              projectName: 'project-307',
              configId: 307,
              configEnvironment: 'test',
              limit: 1000,
            },
            (err, response) => {
              if (err) reject(err);
              else resolve(response);
            },
          );
        },
      );

      const expectedIds = createdA.map((e) => e.id).sort();
      expect(page.events.map((e) => e.id).sort()).toEqual(expectedIds);
      expect(all.events.map((e) => e.id).sort()).toEqual(expectedIds);
      [...page.events, ...all.events].forEach((event) => {
        expect(event.projectId).toBe('307');
      });
    });
  });
});

describe('Analytics Service - Custom Events (#263)', () => {
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

  describe('logCustomEvent', () => {
    it('should log a custom event and return eventTypeId + properties', async () => {
      const response: AnalyticsProto.CustomEventResponse = await new Promise(
        (resolve, reject) => {
          analyticsClient.logCustomEvent(
            {
              configId: 401,
              configEnvironment: 'test',
              environment: 'test',
              category: 'Signup',
              subcategory: 'Button',
              properties: { plan: 'free', step: '2' },
            },
            (err, response) => {
              if (err) reject(err);
              else resolve(response);
            },
          );
        },
      );

      expect(response.id).toBeTruthy();
      expect(response.eventTypeId).toBe('401-Signup-Button');
      expect(response.projectId).toBe('401');
      expect(response.environment).toBe('test');
      expect(response.createdAt).toBeTruthy();
      expect(response.updatedAt).toBeTruthy();
      expect(response.properties).toEqual({ plan: 'free', step: '2' });
    });

    it('should fail with invalid request - missing category or subcategory', async () => {
      await expect(
        new Promise((resolve, reject) => {
          analyticsClient.logCustomEvent(
            {
              configId: 402,
              configEnvironment: 'test',
              environment: 'test',
              category: '',
              subcategory: 'Button',
              properties: { key: 'value' },
            },
            (err, response) => {
              if (err) reject(err);
              else resolve(response);
            },
          );
        }),
      ).rejects.toMatchObject({ code: GRPC.status.INVALID_ARGUMENT });

      await expect(
        new Promise((resolve, reject) => {
          analyticsClient.logCustomEvent(
            {
              configId: 402,
              configEnvironment: 'test',
              environment: 'test',
              category: 'Signup',
              subcategory: '',
              properties: { key: 'value' },
            },
            (err, response) => {
              if (err) reject(err);
              else resolve(response);
            },
          );
        }),
      ).rejects.toMatchObject({ code: GRPC.status.INVALID_ARGUMENT });
    });
  });

  describe('getCustomEventsPaginated', () => {
    it('should respect limit and page with the afterId cursor', async () => {
      // Create 3 events
      const created: any[] = [];
      for (let i = 0; i < 3; i++) {
        created.push(
          await new Promise((resolve, reject) => {
            analyticsClient.logCustomEvent(
              {
                configId: 403,
                configEnvironment: 'test',
                environment: 'test',
                category: 'Signup',
                subcategory: 'Button',
                properties: { i: `${i}` },
              },
              (err, response) => {
                if (err) reject(err);
                else resolve(response);
              },
            );
          }),
        );
      }

      // Get first page
      const firstPage: AnalyticsProto.GetCustomEventsResponse =
        await new Promise((resolve, reject) => {
          analyticsClient.getCustomEventsPaginated(
            {
              projectName: 'project-403',
              configId: 403,
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

      // Get second page using afterId
      const secondPage: AnalyticsProto.GetCustomEventsResponse =
        await new Promise((resolve, reject) => {
          analyticsClient.getCustomEventsPaginated(
            {
              projectName: 'project-403',
              configId: 403,
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

      expect(firstPage.events.map((e) => e.id)).toEqual([
        created[2].id,
        created[1].id,
      ]);
      expect(secondPage.events.map((e) => e.id)).toEqual([created[0].id]);
    });

    it('should only return events at or after afterTime', async () => {
      // Create an earlier event
      await new Promise((resolve, reject) => {
        analyticsClient.logCustomEvent(
          {
            configId: 404,
            configEnvironment: 'test',
            environment: 'test',
            category: 'Signup',
            subcategory: 'Button',
            properties: { key: 'value' },
          },
          (err, response) => {
            if (err) reject(err);
            else resolve(response);
          },
        );
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Create a later event
      const later: AnalyticsProto.CustomEventResponse = await new Promise(
        (resolve, reject) => {
          analyticsClient.logCustomEvent(
            {
              configId: 404,
              configEnvironment: 'test',
              environment: 'test',
              category: 'Signup',
              subcategory: 'Button',
              properties: { key: 'value' },
            },
            (err, response) => {
              if (err) reject(err);
              else resolve(response);
            },
          );
        },
      );

      const response: AnalyticsProto.GetCustomEventsResponse =
        await new Promise((resolve, reject) => {
          analyticsClient.getCustomEventsPaginated(
            {
              projectName: 'project-404',
              configId: 404,
              configEnvironment: 'test',
              environment: 'test',
              limit: 10,
              afterTime: later.createdAt,
            },
            (err, response) => {
              if (err) reject(err);
              else resolve(response);
            },
          );
        });

      expect(response.events.map((e) => e.id)).toEqual([later.id]);
    });

    it('should filter paginated and all reads by category and subcategory', async () => {
      const events = [
        { category: 'Signup', subcategory: 'Button' },
        { category: 'Signup', subcategory: 'Button' },
        { category: 'Signup', subcategory: 'Form' },
        { category: 'Checkout', subcategory: 'Button' },
      ];
      const created: any[] = [];
      for (const event of events) {
        created.push(
          await new Promise((resolve, reject) => {
            analyticsClient.logCustomEvent(
              {
                configId: 405,
                configEnvironment: 'test',
                environment: 'test',
                category: event.category,
                subcategory: event.subcategory,
                properties: { key: 'value' },
              },
              (err, response) => {
                if (err) reject(err);
                else resolve(response);
              },
            );
          }),
        );
      }

      const page: AnalyticsProto.GetCustomEventsResponse = await new Promise(
        (resolve, reject) => {
          analyticsClient.getCustomEventsPaginated(
            {
              projectName: 'project-405',
              configId: 405,
              configEnvironment: 'test',
              environment: 'test',
              limit: 100,
              category: 'Signup',
              subcategory: 'Button',
            },
            (err, response) => {
              if (err) reject(err);
              else resolve(response);
            },
          );
        },
      );

      const all: AnalyticsProto.GetAllCustomEventsResponse = await new Promise(
        (resolve, reject) => {
          analyticsClient.getAllCustomEvents(
            {
              projectName: 'project-405',
              configId: 405,
              configEnvironment: 'test',
              limit: 1000,
              category: 'Signup',
              subcategory: 'Button',
            },
            (err, response) => {
              if (err) reject(err);
              else resolve(response);
            },
          );
        },
      );

      const expectedIds = [created[0].id, created[1].id].sort();
      expect(page.events.map((e) => e.id).sort()).toEqual(expectedIds);
      expect(all.events.map((e) => e.id).sort()).toEqual(expectedIds);

      // Without a filter, all 4 events come back
      const unfiltered: AnalyticsProto.GetAllCustomEventsResponse =
        await new Promise((resolve, reject) => {
          analyticsClient.getAllCustomEvents(
            {
              projectName: 'project-405',
              configId: 405,
              configEnvironment: 'test',
              limit: 1000,
            },
            (err, response) => {
              if (err) reject(err);
              else resolve(response);
            },
          );
        });

      expect(unfiltered.events).toHaveLength(4);
    });

    it('should fail with missing projectName (paginated and all)', async () => {
      await expect(
        new Promise((resolve, reject) => {
          analyticsClient.getCustomEventsPaginated(
            {
              projectName: '',
              configId: 408,
              configEnvironment: 'test',
              environment: 'test',
            },
            (err, response) => {
              if (err) reject(err);
              else resolve(response);
            },
          );
        }),
      ).rejects.toMatchObject({ code: GRPC.status.INVALID_ARGUMENT });

      await expect(
        new Promise((resolve, reject) => {
          analyticsClient.getAllCustomEvents(
            {
              projectName: '',
              configId: 408,
              configEnvironment: 'test',
              limit: 1000,
            },
            (err, response) => {
              if (err) reject(err);
              else resolve(response);
            },
          );
        }),
      ).rejects.toMatchObject({ code: GRPC.status.INVALID_ARGUMENT });
    });
  });

  describe('Project isolation', () => {
    it('should not return custom events from other projects', async () => {
      // Create an event for project 406
      const mine: AnalyticsProto.CustomEventResponse = await new Promise(
        (resolve, reject) => {
          analyticsClient.logCustomEvent(
            {
              configId: 406,
              configEnvironment: 'test',
              environment: 'test',
              category: 'Signup',
              subcategory: 'Button',
              properties: { key: 'value' },
            },
            (err, response) => {
              if (err) reject(err);
              else resolve(response);
            },
          );
        },
      );

      // Create an event for project 407
      await new Promise((resolve, reject) => {
        analyticsClient.logCustomEvent(
          {
            configId: 407,
            configEnvironment: 'test',
            environment: 'test',
            category: 'Signup',
            subcategory: 'Button',
            properties: { key: 'value' },
          },
          (err, response) => {
            if (err) reject(err);
            else resolve(response);
          },
        );
      });

      const page: AnalyticsProto.GetCustomEventsResponse = await new Promise(
        (resolve, reject) => {
          analyticsClient.getCustomEventsPaginated(
            {
              projectName: 'project-406',
              configId: 406,
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

      const all: AnalyticsProto.GetAllCustomEventsResponse = await new Promise(
        (resolve, reject) => {
          analyticsClient.getAllCustomEvents(
            {
              projectName: 'project-406',
              configId: 406,
              configEnvironment: 'test',
              limit: 1000,
            },
            (err, response) => {
              if (err) reject(err);
              else resolve(response);
            },
          );
        },
      );

      expect(page.events.map((e) => e.id)).toEqual([mine.id]);
      expect(all.events.map((e) => e.id)).toEqual([mine.id]);
    });
  });
});

describe('Analytics Service - Custom Event & Graph Types (#263)', () => {
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

  describe('getCustomEventTypes', () => {
    it('should return the distinct category/subcategory pairs stored for the project', async () => {
      const events = [
        {
          configId: 501,
          category: 'Signup',
          subcategory: 'Button',
          properties: { plan: 'free' },
        },
        {
          configId: 501,
          category: 'Signup',
          subcategory: 'Button',
          properties: { plan: 'pro' },
        },
        {
          configId: 501,
          category: 'Signup',
          subcategory: 'Form',
          properties: { field: 'email' },
        },
        {
          configId: 502,
          category: 'Other',
          subcategory: 'Project',
          properties: { x: '1' },
        },
      ];
      for (const event of events) {
        await new Promise((resolve, reject) => {
          analyticsClient.logCustomEvent(
            {
              configEnvironment: 'test',
              environment: 'test',
              ...event,
            },
            (err, response) => {
              if (err) reject(err);
              else resolve(response);
            },
          );
        });
      }

      const response: AnalyticsProto.GetAllCustomEventTypeResponse =
        await new Promise((resolve, reject) => {
          analyticsClient.getCustomEventTypes(
            {
              projectName: 'project-501',
              configId: 501,
              configEnvironment: 'test',
            },
            (err, response) => {
              if (err) reject(err);
              else resolve(response);
            },
          );
        });

      const types = (response.eventTypes ?? [])
        .map((et) => `${et.category}/${et.subcategory}`)
        .sort();
      expect(types).toEqual(['Signup/Button', 'Signup/Form']);
      (response.eventTypes ?? []).forEach((et) => {
        expect(et.projectId).toBe('501');
      });
      const form = response.eventTypes.find((et) => et.subcategory === 'Form');
      expect(form.properties).toEqual(['field']);
    });

    it("should give each type an id that matches its events' eventTypeId (the dash joins on it)", async () => {
      const event: AnalyticsProto.CustomEventResponse = await new Promise(
        (resolve, reject) => {
          analyticsClient.logCustomEvent(
            {
              configId: 503,
              configEnvironment: 'test',
              environment: 'test',
              category: 'Signup',
              subcategory: 'Button',
              properties: { plan: 'free' },
            },
            (err, response) => {
              if (err) reject(err);
              else resolve(response);
            },
          );
        },
      );

      const response: AnalyticsProto.GetAllCustomEventTypeResponse =
        await new Promise((resolve, reject) => {
          analyticsClient.getCustomEventTypes(
            {
              projectName: 'project-503',
              configId: 503,
              configEnvironment: 'test',
            },
            (err, response) => {
              if (err) reject(err);
              else resolve(response);
            },
          );
        });

      expect(response.eventTypes.map((et) => et.id)).toContain(
        event.eventTypeId,
      );
    });

    it('should return an empty list for a project with no custom events', async () => {
      const response: AnalyticsProto.GetAllCustomEventTypeResponse =
        await new Promise((resolve, reject) => {
          analyticsClient.getCustomEventTypes(
            {
              projectName: 'project-504',
              configId: 504,
              configEnvironment: 'test',
            },
            (err, response) => {
              if (err) reject(err);
              else resolve(response);
            },
          );
        });

      expect(response.eventTypes ?? []).toEqual([]);
    });

    it('should fail with missing projectName', async () => {
      await expect(
        new Promise((resolve, reject) => {
          analyticsClient.getCustomEventTypes(
            {
              projectName: '',
              configId: 505,
              configEnvironment: 'test',
            },
            (err, response) => {
              if (err) reject(err);
              else resolve(response);
            },
          );
        }),
      ).rejects.toMatchObject({ code: GRPC.status.INVALID_ARGUMENT });
    });
  });

  describe('getCustomGraphTypesById', () => {
    it('should return an empty list and never error', async () => {
      const response: AnalyticsProto.CustomGraphTypeResponse =
        await new Promise((resolve, reject) => {
          analyticsClient.getCustomGraphTypesById(
            {
              projectName: 'project-501',
              eventTypeId: '501-Signup-Button',
              configId: 501,
              configEnvironment: 'test',
            },
            (err, response) => {
              if (err) reject(err);
              else resolve(response);
            },
          );
        });

      expect(response.graphs ?? []).toEqual([]);
    });
  });
});
