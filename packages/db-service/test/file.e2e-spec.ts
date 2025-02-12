import { INestMicroservice } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { Test, TestingModule } from '@nestjs/testing';
import * as ProtoLoader from '@grpc/proto-loader';
import * as GRPC from '@grpc/grpc-js';

import {
  FileProtoFile,
  FileProto,
  ResetProto,
  ResetProtoFile,
  FileBucketProtoFile,
  FileBucketProto,
} from 'juno-proto';
import { AppModule } from 'src/app.module';

const { JUNO_FILE_SERVICE_FILE_PACKAGE_NAME } = FileProto;
const { JUNO_RESET_DB_PACKAGE_NAME } = ResetProto;

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
        JUNO_FILE_SERVICE_FILE_PACKAGE_NAME,
        JUNO_RESET_DB_PACKAGE_NAME,
        FileBucketProto.JUNO_FILE_SERVICE_BUCKET_PACKAGE_NAME,
      ],
      protoPath: [FileProtoFile, ResetProtoFile, FileBucketProtoFile],
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

describe('DB Service File Tests', () => {
  let fileClient: any;
  const bucketName = 'Test Bucket';
  const configId = 0;
  const configEnv = 'prod';

  beforeEach(async () => {
    const fileProto = ProtoLoader.loadSync([FileProtoFile]) as any;

    const fileProtoGRPC = GRPC.loadPackageDefinition(fileProto) as any;

    fileClient = new fileProtoGRPC.juno.file_service.file.FileDbService(
      process.env.DB_SERVICE_ADDR,
      GRPC.credentials.createInsecure(),
    );
    const resetProto = ProtoLoader.loadSync([ResetProtoFile]) as any;

    const resetProtoGRPC = GRPC.loadPackageDefinition(resetProto) as any;

    const resetClient = new resetProtoGRPC.juno.reset_db.DatabaseReset(
      process.env.DB_SERVICE_ADDR,
      GRPC.credentials.createInsecure(),
    );

    await new Promise((resolve) => {
      resetClient.resetDb({}, () => {
        resolve(0);
      });
    });

    // Create sample bucket
    const bucketProto = ProtoLoader.loadSync([FileBucketProtoFile]) as any;
    const bucketProtoGRPC = GRPC.loadPackageDefinition(bucketProto) as any;
    const bucketClient =
      new bucketProtoGRPC.juno.file_service.bucket.BucketDbService(
        process.env.DB_SERVICE_ADDR,
        GRPC.credentials.createInsecure(),
      );

    await new Promise((resolve) => {
      bucketClient.createBucket(
        {
          name: bucketName,
          configId: configId,
          configEnv: configEnv,
          fileProviderName: 'test-provider',
          files: [],
        },
        () => {
          resolve(0);
        },
      );
    });
  });

  it('Creates file correctly', async () => {
    // Create file and save to DB
    const promise = new Promise((resolve) => {
      fileClient.createFile(
        {
          fileId: {
            bucketName: bucketName,
            configId: configId,
            configEnv: configEnv,
            path: 'Test/file/path/create',
          },
          metadata: 'Test metadata',
        },

        (err) => {
          expect(err).toBeNull();
          resolve({});
        },
      );
    });

    await promise;
  });

  it('Cannot create a duplicate file', async () => {
    const promise1 = new Promise((resolve) => {
      fileClient.createFile(
        {
          fileId: {
            bucketName: bucketName,
            configId: configId,
            configEnv: configEnv,
            path: 'Test/file/path/create',
          },
          metadata: 'Test metadata',
        },

        (err) => {
          expect(err).toBeNull();
          resolve({});
        },
      );
    });

    await promise1;

    const promise2 = new Promise((resolve) => {
      fileClient.createFile(
        {
          fileId: {
            bucketName: bucketName,
            configId: configId,
            configEnv: configEnv,
            path: 'Test/file/path/create',
          },
          metadata: 'Test metadata',
        },

        (err) => {
          expect(err).toHaveProperty('code', GRPC.status.ALREADY_EXISTS);
          resolve({});
        },
      );
    });

    await promise2;
  });

  it('Can delete a file that exists', async () => {
    const promise = new Promise((resolve) => {
      fileClient.createFile(
        {
          fileId: {
            bucketName: bucketName,
            configId: configId,
            configEnv: configEnv,
            path: 'Test/file/path/delete',
          },
          metadata: 'Test metadata',
        },

        (err) => {
          expect(err).toBeNull();
          resolve({});
        },
      );
    });

    await promise;

    const deletionPromise = new Promise((resolve) => {
      fileClient.deleteFile(
        {
          fileId: {
            bucketName: bucketName,
            configId: configId,
            configEnv: configEnv,
            path: 'Test/file/path/delete',
          },
        },
        (err) => {
          expect(err).toBeNull();
          resolve({});
        },
      );
    });

    await deletionPromise;
  });

  it('Cannot delete a file that does not exist', async () => {
    const promise = new Promise((resolve) => {
      fileClient.deleteFile(
        {
          fileId: {
            bucketName: 'File does not exist',
            configId: 2,
            configEnv: configEnv,
            path: 'Test/file/path/not-exist',
          },
        },
        (err) => {
          expect(err).toHaveProperty('code', GRPC.status.NOT_FOUND);
          resolve({});
        },
      );
    });

    await promise;
  });

  it('Can update a file that exists', async () => {
    const promise = new Promise((resolve) => {
      fileClient.createFile(
        {
          fileId: {
            bucketName: bucketName,
            configId: configId,
            configEnv: configEnv,
            path: 'Test/file/path/update',
          },
          metadata: 'Test metadata',
        },

        (err) => {
          expect(err).toBeNull();
          resolve({});
        },
      );
    });

    await promise;

    const updatePromise = new Promise((resolve) => {
      fileClient.updateFile(
        {
          fileId: {
            bucketName: bucketName,
            configId: configId,
            configEnv: configEnv,
            path: 'Test/file/path/update',
          },
          metadata: 'New metadata',
        },
        (err) => {
          expect(err).toBeNull();
          resolve({});
        },
      );
    });

    await updatePromise;
  });

  it('Cannot update a file that does not exist', async () => {
    const promise = new Promise((resolve) => {
      fileClient.updateFile(
        {
          fileId: {
            bucketName: 'File does not exist',
            configId: 3,
            configEnv: configEnv,
            path: 'Test/file/path/not-exist',
          },
          metadata: 'New metadata',
        },
        (err) => {
          expect(err).toHaveProperty('code', GRPC.status.NOT_FOUND);
          resolve({});
        },
      );
    });

    await promise;
  });

  it('can get a file', async () => {
    const promise = new Promise((resolve) => {
      fileClient.createFile(
        {
          fileId: {
            bucketName: bucketName,
            configId: configId,
            configEnv: configEnv,
            path: 'Test/file/path/get',
          },
          metadata: 'Test metadata',
        },

        (err) => {
          expect(err).toBeNull();
          resolve({});
        },
      );
    });

    await promise;

    const getPromise = new Promise((resolve) => {
      fileClient.getFile(
        {
          fileId: {
            bucketName: bucketName,
            configId: configId,
            configEnv: configEnv,
            path: 'Test/file/path/get',
          },
        },
        (err) => {
          expect(err).toBeNull();
          resolve({});
        },
      );
    });

    await getPromise;
  });

  it('Cannot get a file that does not exist', async () => {
    const promise = new Promise((resolve) => {
      fileClient.getFile(
        {
          fileId: {
            bucketName: 'File does not exist',
            configId: 4,
            configEnv: configEnv,
            path: 'Test/file/path/not-exist',
          },
        },
        (err) => {
          expect(err).toHaveProperty('code', GRPC.status.NOT_FOUND);
          resolve({});
        },
      );
    });

    await promise;
  });
});
