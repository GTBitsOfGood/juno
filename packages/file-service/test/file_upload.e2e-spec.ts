import { INestMicroservice } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { Test, TestingModule } from '@nestjs/testing';
import * as ProtoLoader from '@grpc/proto-loader';
import * as GRPC from '@grpc/grpc-js';

import {
  FileProtoFile,
  FileProto,
  ResetProtoFile,
  FileBucketProtoFile,
} from 'juno-proto';
import { AppModule } from './../src/app.module';

const { JUNO_FILE_SERVICE_FILE_PACKAGE_NAME } = FileProto;

let app: INestMicroservice;

jest.setTimeout(10000);

async function initApp() {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: [JUNO_FILE_SERVICE_FILE_PACKAGE_NAME],
      protoPath: [FileProtoFile],
      url: process.env.FILE_SERVICE_ADDR,
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

describe('File Service File Upload Tests', () => {
  let fileClient: any;
  const bucketName = 'Test Bucket';
  const configId = 0;
  const metadata = 'Metadata';
  const accessKey = 'Access Key';

  beforeEach(async () => {
    const fileProto = ProtoLoader.loadSync([FileProtoFile]) as any;

    const fileProtoGRPC = GRPC.loadPackageDefinition(fileProto) as any;

    fileClient = new fileProtoGRPC.juno.file_service.file.FileService(
      process.env.FILE_SERVICE_ADDR,
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
          fileProviderName: 'test-provider',
          files: [],
        },
        () => {
          resolve(0);
        },
      );
    });
  });

  it('Uploads file correctly', async () => {
    const promise = new Promise((resolve) => {
      fileClient.uploadFile(
        {
          bucket: `{"name":${bucketName}, "configId":${configId}}`,
          data: 'Test data',
          fileName: 'Test file name',
          provider: `{"metadata":${metadata}, "accessKey":${accessKey}}`,
        },

        (err: any) => {
          expect(err).toBeNull();
          resolve({});
        },
      );
    });

    await promise;
  });

  it('Cannot upload a duplicate file', async () => {
    const promise1 = new Promise((resolve) => {
      fileClient.uploadFile(
        {
          bucket: `{"name":${bucketName}, "configId":${configId}}`,
          data: 'Test data',
          fileName: 'Test file name',
          provider: `{"metadata":${metadata}, "accessKey":${accessKey}}`,
        },

        (err: any) => {
          expect(err).toBeNull();
          resolve({});
        },
      );
    });

    await promise1;

    const promise2 = new Promise((resolve) => {
      fileClient.uploadFile(
        {
          bucket: `{"name":${bucketName}, "configId":${configId}}`,
          data: 'Test data',
          fileName: 'Test file name',
          provider: `{"metadata":${metadata}, "accessKey":${accessKey}}`,
        },

        (err: any) => {
          expect(err).not.toBeNull();
          resolve({});
        },
      );
    });

    await promise2;
  });
});
