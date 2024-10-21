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
      ],
      protoPath: [FileProtoFile, ResetProtoFile],
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

  beforeEach(() => {
    const fileProto = ProtoLoader.loadSync([FileProtoFile]) as any;

    const fileProtoGRPC = GRPC.loadPackageDefinition(fileProto) as any;

    fileClient = new fileProtoGRPC.juno.file_service.file.FileDbService(
      process.env.DB_SERVICE_ADDR,
      GRPC.credentials.createInsecure(),
    );
  });

  it('Creates file correctly', async () => {
    // Create file and save to DB
    const promise = new Promise((resolve) => {
      fileClient.createFile(
        {
          bucketName: 'Test Bucket',
          configId: 1,
          filePath: 'Test/file/path',
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
    // Create email linked to test project
    const promise = new Promise((resolve) => {
      fileClient.createFile(
        {
          bucketName: 'Test Bucket',
          configId: 1,
          filePath: 'Test/file/path',
          metadata: 'Test metadata',
        },

        (err) => {
          expect(err).not.toBeNull();
          resolve({});
        },
      );
    });

    await promise;
  });

  it('Can delete a file that exists', async () => {
    const promise = new Promise((resolve) => {
      fileClient.createFile(
        {
          bucketName: 'To be deleted',
          configId: 1,
          filePath: 'Test/file/path/delete',
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
          bucketName: 'To be deleted',
          configId: 1,
          filePath: 'Test/file/path/delete',
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
          bucketName: 'File does not exist',
          configId: 1,
          filePath: 'Test/file/path/not-exist',
        },
        (err) => {
          expect(err).not.toBeNull();
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
          bucketName: 'To be updated',
          configId: 1,
          filePath: 'Test/file/path/update',
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
          bucketName: 'To be updated',
          configId: 1,
          filePath: 'Test/file/path/update',
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
          bucketName: 'File does not exist',
          configId: 1,
          filePath: 'Test/file/path/not-exist',
          metadata: 'New metadata',
        },
        (err) => {
          expect(err).not.toBeNull();
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
          bucketName: 'To be retrieved',
          configId: 1,
          filePath: 'Test/file/path/get',
          metadata: 'Test metadata',
        },

        (err, resp) => {
          expect(err).toBeNull();
          resolve(resp);
        },
      );
    });

    const resultingFile = (await promise) as any;

    const getPromise = new Promise((resolve) => {
      fileClient.getFile(
        {
          bucketName: resultingFile.bucketName,
          configId: resultingFile.configId,
          filePath: resultingFile.filePath,
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
          bucketName: 'File does not exist',
          configId: 3,
          filePath: 'Test/file/path/not-exist',
        },
        (err) => {
          expect(err).not.toBeNull();
          resolve({});
        },
      );
    });

    await promise;
  });
});
