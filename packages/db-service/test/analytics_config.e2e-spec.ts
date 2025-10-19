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
import { PrismaService } from '../src/prisma.service';

let app: INestMicroservice;
let createdConfigId: number;
let prismaService: PrismaService;

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
  
  // Get PrismaService for direct database operations
  prismaService = moduleFixture.get<PrismaService>(PrismaService);
  
  return app;
}

async function cleanupAnalyticsConfigs() {
  // Direct database cleanup using Prisma
  console.log('Cleaning up analytics configs...');
  const deleted = await prismaService.analyticsServiceConfig.deleteMany({
    where: {
      id: 0,
    },
  });
  console.log(`Deleted ${deleted.count} analytics configs`);
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
        analyticsKey: 'test-analytics-key',
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
    const response: AnalyticsConfigProto.AnalyticsServiceConfig = await new Promise(
      (resolve, reject) => {
        configClient.createAnalyticsConfig(
          {
            projectId: 0,
            environment: 'test-env',
            analyticsKey: 'test-analytics-key',
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
      },
    );

    expect(response).toHaveProperty('id');
    expect(response.environment).toBe('test-env');
    expect(response.analyticsKey).toBe('test-analytics-key');
  });

  it('creates a duplicate analytics config', async () => {
    const response: AnalyticsConfigProto.AnalyticsServiceConfig = await new Promise(
      (resolve, reject) => {
        configClient.createAnalyticsConfig(
          {
            projectId: 0,
            environment: 'prod',
            analyticsKey: 'prod-analytics-key',
          },
          (err, res) => {
            if (err) {
              reject(err);
            } else {
              resolve(res);
            }
          },
        );
      },
    );
    expect(response).toHaveProperty('id');
    expect(response.environment).toBe('prod');
    expect(response.analyticsKey).toBe('prod-analytics-key');
  });

  it('reads an analytics config', async () => {
    await tryCreateConfig(configClient);
    const readResponse: AnalyticsConfigProto.AnalyticsServiceConfig = await new Promise(
      (resolve, reject) => {
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
      },
    );

    expect(readResponse).toHaveProperty('id', createdConfigId);
    expect(readResponse.environment).toBe('test-env');
    expect(readResponse.analyticsKey).toBe('test-analytics-key');
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
    const updateResponse: AnalyticsConfigProto.AnalyticsServiceConfig = await new Promise((resolve, reject) => {
      configClient.updateAnalyticsConfig(
        {
          id: createdConfigId,
          environment: 'test-env',
          analyticsKey: 'updated-analytics-key',
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
    expect(updateResponse.analyticsKey).toBe('updated-analytics-key');
  });

  it('updates a nonexistent analytics config', async () => {
    await new Promise((resolve) => {
      configClient.updateAnalyticsConfig(
        {
          id: 9999,
          environment: 'test-env',
          analyticsKey: 'updated-analytics-key',
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
    const deleteResponse: AnalyticsConfigProto.AnalyticsServiceConfig = await new Promise((resolve, reject) => {
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
