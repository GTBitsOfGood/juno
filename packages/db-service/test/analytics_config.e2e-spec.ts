import * as GRPC from '@grpc/grpc-js';
import * as ProtoLoader from '@grpc/proto-loader';
import { INestMicroservice } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { Test, TestingModule } from '@nestjs/testing';
import {
  AnalyticsConfigProto,
  AnalyticsConfigProtoFile,
  ResetProto,
  ResetProtoFile,
} from 'juno-proto';
import { AppModule } from '../src/app.module';

let app: INestMicroservice;
let createdConfigId: number;

jest.setTimeout(15000);

async function initApp() {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: [
        AnalyticsConfigProto.JUNO_ANALYTICS_SERVICE_ANALYTICS_CONFIG_PACKAGE_NAME,
        ResetProto.JUNO_RESET_DB_PACKAGE_NAME,
      ],
      protoPath: [AnalyticsConfigProtoFile, ResetProtoFile],
      url: process.env.DB_SERVICE_ADDR,
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

  app.close();
});

beforeEach(async () => {
  app = await initApp();
});

afterEach(async () => {
  await app.close();
});

function tryCreateConfig(configClient: any) {
  return new Promise<void>((resolve) => {
    configClient.createAnalyticsConfig(
      {
        projectId: 0,
        environment: 'test-env',
        serverAnalyticsKey: 'mock-api-key-123',
        clientAnalyticsKey: 'mock-api-key-123',
      },
      () => {
        resolve();
      },
    );
  });
}

describe('Analytics Config Tests', () => {
  let configClient: any;

  beforeEach(() => {
    const proto = ProtoLoader.loadSync([AnalyticsConfigProtoFile]) as any;
    const protoGRPC = GRPC.loadPackageDefinition(proto) as any;
    configClient =
      new protoGRPC.juno.analytics_service.analytics_config.AnalyticsConfigDbService(
        process.env.DB_SERVICE_ADDR,
        GRPC.credentials.createInsecure(),
      );
  });

  it('creates a new analytics config', async () => {
    const response: AnalyticsConfigProto.AnalyticsServiceConfig =
      await new Promise((resolve, reject) => {
        configClient.createAnalyticsConfig(
          {
            projectId: 0,
            environment: 'test-env',
            serverAnalyticsKey: 'test-analytics-key',
            clientAnalyticsKey: 'test-analytics-key-2',
          },
          (err, res) => {
            if (err) {
              reject(err);
            } else {
              createdConfigId = res.id;
              resolve(res);
            }
          },
        );
      });

    expect(response).toHaveProperty('id');
    expect(response.environment).toBe('test-env');
    expect(response.serverAnalyticsKey).toBe('test-analytics-key');
    expect(response.clientAnalyticsKey).toBe('test-analytics-key-2');
  });

  it('creates a duplicate analytics config', async () => {
    const response: AnalyticsConfigProto.AnalyticsServiceConfig =
      await new Promise((resolve, reject) => {
        configClient.createAnalyticsConfig(
          {
            projectId: 0,
            environment: 'prod',
            serverAnalyticsKey: 'test-analytics-key',
            clientAnalyticsKey: 'test-analytics-key-2',
          },
          (err, res) => {
            if (err) {
              reject(err);
            } else {
              resolve(res);
            }
          },
        );
      });
    expect(response).toHaveProperty('id');
    expect(response.environment).toBe('prod');
    expect(response.serverAnalyticsKey).toBe('test-analytics-key');
    expect(response.clientAnalyticsKey).toBe('test-analytics-key-2');
  });

  it('reads an analytics config', async () => {
    await tryCreateConfig(configClient);
    const readResponse: AnalyticsConfigProto.AnalyticsServiceConfig =
      await new Promise((resolve, reject) => {
        configClient.readAnalyticsConfig(
          { id: createdConfigId, environment: 'test-env' },
          (err, res) => {
            if (err) {
              reject(err);
            } else {
              resolve(res);
            }
          },
        );
      });

    expect(readResponse).toHaveProperty('id', createdConfigId);
    expect(readResponse.environment).toBe('test-env');
  });

  it('reading a nonexistent analytics config', async () => {
    await new Promise((resolve) => {
      configClient.readAnalyticsConfig(
        { id: 9999, environment: 'prod' },
        (err) => {
          expect(err.code).toBe(GRPC.status.NOT_FOUND);
          expect(err.details).toBe('Analytics configuration not found');
          resolve({});
        },
      );
    });
  });

  it('updates an analytics config', async () => {
    await tryCreateConfig(configClient);
    const updateResponse: AnalyticsConfigProto.AnalyticsServiceConfig =
      await new Promise((resolve, reject) => {
        configClient.updateAnalyticsConfig(
          {
            id: createdConfigId,
            environment: 'test-env',
            serverAnalyticsKey: 'updated-server-key',
            clientAnalyticsKey: 'updated-client-key',
          },
          (err, res) => {
            if (err) {
              reject(err);
            } else {
              resolve(res);
            }
          },
        );
      });

    expect(updateResponse).toHaveProperty('id', createdConfigId);
    expect(updateResponse.serverAnalyticsKey).toBe('updated-server-key');
    expect(updateResponse.clientAnalyticsKey).toBe('updated-client-key');
  });

  it('updates a nonexistent analytics config', async () => {
    await new Promise((resolve) => {
      configClient.updateAnalyticsConfig(
        {
          id: 9999,
          environment: 'test-env',
          serverAnalyticsKey: 'mock-api-key-123',
          clientAnalyticsKey: 'mock-api-key-123',
        },
        (err) => {
          expect(err.code).toBe(GRPC.status.NOT_FOUND);
          expect(err.details).toBe('Analytics configuration not found');
          resolve({});
        },
      );
    });
  });

  it('deletes an analytics config', async () => {
    await tryCreateConfig(configClient);
    const deleteResponse: AnalyticsConfigProto.AnalyticsServiceConfig =
      await new Promise((resolve, reject) => {
        configClient.deleteAnalyticsConfig(
          { id: createdConfigId, environment: 'test-env' },
          (err, res) => {
            if (err) {
              reject(err);
            } else {
              resolve(res);
            }
          },
        );
      });

    expect(deleteResponse).toHaveProperty('id', createdConfigId);
  });

  it('deletes a nonexistent analytics config', async () => {
    await new Promise((resolve) => {
      configClient.deleteAnalyticsConfig(
        { id: 9999, environment: 'prod' },
        (err) => {
          expect(err.code).toBe(GRPC.status.NOT_FOUND);
          expect(err.details).toBe('Analytics configuration not found');
          resolve({});
        },
      );
    });
  });
});
