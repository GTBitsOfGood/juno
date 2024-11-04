import { Test, TestingModule } from '@nestjs/testing';
import { INestMicroservice } from '@nestjs/common';
import { AppModule } from './../src/app.module';
import * as ProtoLoader from '@grpc/proto-loader';
import * as GRPC from '@grpc/grpc-js';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import {
  IdentifiersProtoFile,
  ResetProto,
  ResetProtoFile,
  FileBucketProto,
  FileBucketProtoFile,
} from 'juno-proto';

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
        FileBucketProto.JUNO_FILE_SERVICE_CONFIG_PACKAGE_NAME,
        ResetProto.JUNO_RESET_DB_PACKAGE_NAME,
      ],
      protoPath: [FileBucketProtoFile, ResetProtoFile],
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
  app.close();
});

describe('DB Service File Bucket Tests', () => {
  let fileBucketClient: any;
  beforeEach(() => {
    const proto = ProtoLoader.loadSync([
      FileBucketProtoFile,
      IdentifiersProtoFile,
    ]) as any;

    const protoGRPC = GRPC.loadPackageDefinition(proto) as any;

    fileBucketClient =
      new protoGRPC.juno.file_service.config.BucketBucketDbService(
        process.env.DB_SERVICE_ADDR,
        GRPC.credentials.createInsecure(),
      );
  });

  const createdBuckets: any[] = [];

  it('creates a new bucket', async () => {
    await new Promise((resolve) => {
      fileBucketClient.createBucket(
        {
          name: 'test',
          configId: 0,
          fileProviderName: 'test-provider',
          files: [],
        },
        (err, resp) => {
          expect(err).toBeNull();
          createdBuckets.push((resp.name, resp.configId));
          resolve({});
        },
      );
    });
  });

  it('Fails to create duplicate bucket', async () => {
    await new Promise((resolve) => {
      fileBucketClient.createBucket(
        {
          name: 'test',
          configId: 0,
          fileProviderName: 'test-provider',
          files: [],
        },
        (err) => {
          expect(err).not.toBeNull();
          resolve({});
        },
      );
    });
  });

  it('Deletes Bucket', async () => {
    await new Promise((resolve) => {
      fileBucketClient.createBucket(
        {
          name: 'deleter',
          configId: 0,
          fileProviderName: 'test-provider',
          files: [],
        },
        (err) => {
          expect(err).toBeNull();
          resolve({});
        },
      );
    });
    await new Promise((resolve) => {
      fileBucketClient.deleteBucket(
        {
          name: 'deleter',
          configId: 0,
        },
        (err) => {
          expect(err).toBeNull();
          resolve({});
        },
      );
    });
  });

  it('Fails to delete nonexistent bucket', async () => {
    await new Promise((resolve) => {
      fileBucketClient.deleteBucket(
        {
          name: 'test',
          configId: 1000,
        },
        (err) => {
          expect(err).not.toBeNull();
          resolve({});
        },
      );
    });
  });

  it('Updates Bucket', async () => {
    await new Promise((resolve) => {
      fileBucketClient.createBucket(
        {
          name: 'updater',
          configId: 0,
          fileProviderName: 'test-provider',
          files: [],
        },
        (err) => {
          expect(err).toBeNull();
          resolve({});
        },
      );
    });
    await new Promise((resolve) => {
      fileBucketClient.updateBucket(
        {
          name: 'updater',
          configId: 0,
          fileProviderName: 'test-provider',
        },
        (err, resp) => {
          expect(err).toBeNull();
          createdBuckets.push((resp.name, resp.configId));
          resolve({});
        },
      );
    });
  });
  it('Fails to update nonexistent bucket', async () => {
    await new Promise((resolve) => {
      fileBucketClient.updateBucket(
        {
          name: 'notupdatable',
          configId: 5,
          fileProviderName: 'test-provider',
        },
        (err) => {
          expect(err).not.toBeNull();
          resolve({});
        },
      );
    });
  });
  it('Fails to read nonexistent bucket', async () => {
    await new Promise((resolve) => {
      fileBucketClient.getBucket(
        {
          name: 'notupdatable',
          configId: 5,
        },
        (err) => {
          expect(err).not.toBeNull();
          resolve({});
        },
      );
    });
  });
  it('Reads Bucket', async () => {
    await new Promise((resolve) => {
      fileBucketClient.createBucket(
        {
          name: 'reader',
          configId: 0,
          fileProviderName: 'test-provider',
        },
        (err, resp) => {
          expect(err).toBeNull();
          createdBuckets.push((resp.name, resp.configId));
          resolve({});
        },
      );
    });
    await new Promise((resolve) => {
      fileBucketClient.getBucket(
        {
          name: 'reader',
          configId: 0,
        },
        (err) => {
          expect(err).toBeNull();
          resolve({});
        },
      );
    });
  });
});
