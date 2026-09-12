import { INestMicroservice } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { Test, TestingModule } from '@nestjs/testing';
import * as ProtoLoader from '@grpc/proto-loader';
import * as GRPC from '@grpc/grpc-js';

import {
  FeatureFlagProtoFile,
  ResetProto,
  ResetProtoFile,
  FeatureFlagProto,
} from 'juno-proto';
import { AppModule } from 'src/app.module';

const { JUNO_FEATURE_FLAG_PACKAGE_NAME } = FeatureFlagProto;

let app: INestMicroservice;

jest.setTimeout(10000);

async function initApp() {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: [
        JUNO_FEATURE_FLAG_PACKAGE_NAME,
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
  const app = await initApp();
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
  app.close();
});

describe('DB Service Feature Flag Tests', () => {
  let featureFlagClient: any;

  beforeEach(() => {
    const featureFlagProto = ProtoLoader.loadSync([
      FeatureFlagProtoFile,
    ]) as any;

    const featureFlagProtoGRPC = GRPC.loadPackageDefinition(
      featureFlagProto,
    ) as any;

    featureFlagClient =
      new featureFlagProtoGRPC.juno.feature_flag.FeatureFlagDbService(
        process.env.DB_SERVICE_ADDR,
        GRPC.credentials.createInsecure(),
      );
  });

  it('creates a feature flag record correctly with all fields', async () => {
    const promise = new Promise((resolve) => {
      featureFlagClient.createFlag(
        {
          id: 'test-flag-full',
          enabled: true,
          description: 'A full test feature flag',
        },
        (err) => {
          expect(err).toBeNull();
          resolve({});
        },
      );
    });

    await promise;
  });

  it('can retrieve an existing feature flag record', async () => {
    const flagId = 'retrieve-test-flag';

    const createPromise = new Promise((resolve) => {
      featureFlagClient.createFlag(
        {
          id: flagId,
          enabled: true,
          description: 'Ready for retrieval',
        },
        (err) => {
          expect(err).toBeNull();
          resolve({});
        },
      );
    });

    await createPromise;

    const retrievePromise = new Promise((resolve) => {
      featureFlagClient.getFlag(
        {
          id: flagId,
        },
        (err) => {
          expect(err).toBeNull();
          resolve({});
        },
      );
    });

    await retrievePromise;
  });

  it("can set a feature flag's state for an existing record", async () => {
    const flagId = 'set-test-flag';

    const createPromise = new Promise((resolve) => {
      featureFlagClient.createFlag(
        {
          id: flagId,
          enabled: false,
          description: 'original',
        },
        (err) => {
          expect(err).toBeNull();
          resolve({});
        },
      );
    });

    await createPromise;

    const updatePromise = new Promise((resolve) => {
      featureFlagClient.setFlag(
        {
          id: flagId,
          enabled: true,
          description: 'State has been updated',
        },
        (err) => {
          expect(err).toBeNull();
          resolve({});
        },
      );
    });

    await updatePromise;
  });

  it('can delete an existing feature flag record', async () => {
    const flagId = 'delete-test-flag';

    const createPromise = new Promise((resolve) => {
      featureFlagClient.createFlag(
        {
          id: flagId,
          enabled: false,
        },
        (err) => {
          expect(err).toBeNull();
          resolve({});
        },
      );
    });

    await createPromise;

    const deletionPromise = new Promise((resolve) => {
      featureFlagClient.deleteFlag(
        {
          id: flagId,
        },
        (err) => {
          expect(err).toBeNull();
          resolve({});
        },
      );
    });

    await deletionPromise;
  });
});
