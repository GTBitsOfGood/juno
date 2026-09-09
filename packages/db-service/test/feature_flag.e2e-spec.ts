import * as GRPC from '@grpc/grpc-js';
import * as ProtoLoader from '@grpc/proto-loader';
import { INestMicroservice } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { Test, TestingModule } from '@nestjs/testing';
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import {
  FeatureFlagProto,
  FeatureFlagProtoFile,
  ResetProto,
  ResetProtoFile,
} from 'juno-proto';
import { AppModule } from 'src/app.module';

let app: INestMicroservice;

jest.setTimeout(15000);

async function initApp() {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const microservice =
    moduleFixture.createNestMicroservice<MicroserviceOptions>({
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

  await microservice.init();
  await microservice.listen();
  return microservice;
}

async function resetDatabase() {
  const proto = ProtoLoader.loadSync([ResetProtoFile]) as any;
  const protoGrpc = GRPC.loadPackageDefinition(proto) as any;
  const resetClient = new protoGrpc.juno.reset_db.DatabaseReset(
    process.env.DB_SERVICE_ADDR,
    GRPC.credentials.createInsecure(),
  );

  await new Promise<void>((resolve, reject) => {
    resetClient.resetDb({}, (error: Error | null) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
}

function createFeatureFlagClient() {
  const proto = ProtoLoader.loadSync([FeatureFlagProtoFile]) as any;
  const protoGrpc = GRPC.loadPackageDefinition(proto) as any;
  return new protoGrpc.juno.feature_flag.FeatureFlagService(
    process.env.DB_SERVICE_ADDR,
    GRPC.credentials.createInsecure(),
  );
}

function callGrpc<T>(
  call: (callback: (error: any, response: T) => void) => void,
) {
  return new Promise<T>((resolve, reject) => {
    call((error, response) => {
      if (error) {
        reject(error);
      } else {
        resolve(response);
      }
    });
  });
}

beforeAll(async () => {
  app = await initApp();
  await resetDatabase();
  await app.close();
});

beforeEach(async () => {
  app = await initApp();
});

afterEach(async () => {
  await app.close();
});

describe('Feature Flag Tests', () => {
  let featureFlagClient: any;

  beforeEach(() => {
    featureFlagClient = createFeatureFlagClient();
  });

  it('creates and retrieves a feature flag', async () => {
    const created = await callGrpc<FeatureFlagProto.FeatureFlag>((callback) =>
      featureFlagClient.createFlag(
        {
          id: 'dark-mode',
          enabled: false,
          description: 'Controls dark mode',
        },
        callback,
      ),
    );

    expect(created).toEqual({
      id: 'dark-mode',
      enabled: false,
      description: 'Controls dark mode',
    });

    const retrieved = await callGrpc<FeatureFlagProto.FeatureFlag>((callback) =>
      featureFlagClient.getFlag({ id: 'dark-mode' }, callback),
    );

    expect(retrieved).toEqual(created);
  });

  it('rejects duplicate feature flag IDs', async () => {
    const flag = { id: 'duplicate', enabled: false, description: 'first' };

    await callGrpc<FeatureFlagProto.FeatureFlag>((callback) =>
      featureFlagClient.createFlag(flag, callback),
    );

    await expect(
      callGrpc<FeatureFlagProto.FeatureFlag>((callback) =>
        featureFlagClient.createFlag(flag, callback),
      ),
    ).rejects.toMatchObject({ code: GRPC.status.ALREADY_EXISTS });
  });

  it('updates only the fields provided', async () => {
    await callGrpc<FeatureFlagProto.FeatureFlag>((callback) =>
      featureFlagClient.createFlag(
        {
          id: 'partial-update',
          enabled: false,
          description: 'original',
        },
        callback,
      ),
    );

    const updated = await callGrpc<FeatureFlagProto.FeatureFlag>((callback) =>
      featureFlagClient.setFlag(
        { id: 'partial-update', enabled: true },
        callback,
      ),
    );

    expect(updated).toEqual({
      id: 'partial-update',
      enabled: true,
      description: 'original',
    });
  });

  it('deletes a feature flag', async () => {
    await callGrpc<FeatureFlagProto.FeatureFlag>((callback) =>
      featureFlagClient.createFlag(
        { id: 'to-delete', enabled: true, description: 'temporary' },
        callback,
      ),
    );

    const deleted = await callGrpc<FeatureFlagProto.FeatureFlag>((callback) =>
      featureFlagClient.deleteFlag({ id: 'to-delete' }, callback),
    );

    expect(deleted.id).toBe('to-delete');

    await expect(
      callGrpc<FeatureFlagProto.FeatureFlag>((callback) =>
        featureFlagClient.getFlag({ id: 'to-delete' }, callback),
      ),
    ).rejects.toMatchObject({ code: GRPC.status.NOT_FOUND });
  });
});
