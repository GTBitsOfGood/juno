import * as GRPC from '@grpc/grpc-js';
import * as ProtoLoader from '@grpc/proto-loader';
import { INestMicroservice } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { Test, TestingModule } from '@nestjs/testing';
import {
  FeatureFlagProto,
  FeatureFlagProtoFile,
  ResetProto,
  ResetProtoFile,
} from 'juno-proto';
import { AppModule } from '../src/app.module';

let app: INestMicroservice;

jest.setTimeout(15000);

async function initApp() {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: [
        FeatureFlagProto.JUNO_FEATURE_FLAG_PACKAGE_NAME,
        ResetProto.JUNO_RESET_DB_PACKAGE_NAME,
      ],
      protoPath: [FeatureFlagProtoFile, ResetProtoFile],
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

function tryCreateFlag(flagClient: any, id: string) {
  return new Promise<void>((resolve) => {
    flagClient.createFlag(
      {
        id,
        enabled: true,
        description: 'seed flag',
      },
      () => {
        resolve();
      },
    );
  });
}

describe('Feature Flag Tests', () => {
  let flagClient: any;

  beforeEach(() => {
    const proto = ProtoLoader.loadSync([FeatureFlagProtoFile]) as any;
    const protoGRPC = GRPC.loadPackageDefinition(proto) as any;
    flagClient = new protoGRPC.juno.feature_flag.FeatureFlagService(
      process.env.DB_SERVICE_ADDR,
      GRPC.credentials.createInsecure(),
    );
  });

  it('creates a new feature flag', async () => {
    const response: FeatureFlagProto.CreateFlagResponse = await new Promise(
      (resolve, reject) => {
        flagClient.createFlag(
          {
            id: 'feature-flag-1',
            enabled: true,
            description: 'toggles feature 1',
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

    expect(response.flag).toHaveProperty('id', 'feature-flag-1');
    expect(response.flag.enabled).toBe(true);
    expect(response.flag.description).toBe('toggles feature 1');
  });

  it('gets an existing feature flag', async () => {
    await tryCreateFlag(flagClient, 'feature-flag-2');
    const response: FeatureFlagProto.GetFlagResponse = await new Promise(
      (resolve, reject) => {
        flagClient.getFlag({ id: 'feature-flag-2' }, (err, res) => {
          if (err) {
            reject(err);
          } else {
            resolve(res);
          }
        });
      },
    );

    expect(response.flag).toHaveProperty('id', 'feature-flag-2');
    expect(response.flag.enabled).toBe(true);
  });

  it('getting a nonexistent feature flag', async () => {
    await new Promise((resolve) => {
      flagClient.getFlag({ id: 'feature-flag-100' }, (err) => {
        expect(err.code).toBe(GRPC.status.NOT_FOUND);
        resolve({});
      });
    });
  });

  it('updates an existing feature flag', async () => {
    await tryCreateFlag(flagClient, 'feature-flag-3');
    const response: FeatureFlagProto.SetFlagResponse = await new Promise(
      (resolve, reject) => {
        flagClient.setFlag(
          { id: 'feature-flag-3', enabled: false },
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

    expect(response.flag).toHaveProperty('id', 'feature-flag-3');
    expect(response.flag.enabled).toBe(false);
  });

  it('updating a nonexistent feature flag', async () => {
    await new Promise((resolve) => {
      flagClient.setFlag({ id: 'feature-flag-1000', enabled: true }, (err) => {
        expect(err.code).toBe(GRPC.status.NOT_FOUND);
        resolve({});
      });
    });
  });

  it('deletes an existing feature flag', async () => {
    await tryCreateFlag(flagClient, 'feature-flag-4');
    const response: FeatureFlagProto.DeleteFlagResponse = await new Promise(
      (resolve, reject) => {
        flagClient.deleteFlag({ id: 'feature-flag-4' }, (err, res) => {
          if (err) {
            reject(err);
          } else {
            resolve(res);
          }
        });
      },
    );

    expect(response.success).toBe(true);
  });

  it('deleting a nonexistent feature flag', async () => {
    await new Promise((resolve) => {
      flagClient.deleteFlag({ id: 'feature-flag-100' }, (err) => {
        expect(err.code).toBe(GRPC.status.NOT_FOUND);
        resolve({});
      });
    });
  });
});
