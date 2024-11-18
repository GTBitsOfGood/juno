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
  FileProviderProtoFile,
} from 'juno-proto';
import { AppModule } from './../src/app.module';

const { JUNO_FILE_SERVICE_FILE_PACKAGE_NAME } = FileProto;

let app: INestMicroservice;

const TEST_SERVICE_ADDR = 'file-service:50003';

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
      url: TEST_SERVICE_ADDR,
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

  const fileProto = ProtoLoader.loadSync([FileProtoFile]) as any;

  const fileProtoGRPC = GRPC.loadPackageDefinition(fileProto) as any;

  fileClient = new fileProtoGRPC.juno.file_service.file.FileService(
    TEST_SERVICE_ADDR,
    GRPC.credentials.createInsecure(),
  );

  // Create sample provider
  const providerProto = ProtoLoader.loadSync([FileProviderProtoFile]) as any;
  const providerProtoGRPC = GRPC.loadPackageDefinition(providerProto) as any;
  const providerClient =
    new providerProtoGRPC.juno.file_service.provider.FileProviderDbService(
      process.env.DB_SERVICE_ADDR,
      GRPC.credentials.createInsecure(),
    );

  await new Promise((resolve) => {
    providerClient.createProvider(
      {
        providerName: providerName,
        accessKey: JSON.stringify({
          accessKeyId: accessKeyId,
          secretAccessKey: secretAccessKey,
        }),
        metadata: JSON.stringify({ endpoint: baseURL }),
        bucket: [],
      },
      () => {
        resolve(0);
      },
    );
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
        fileProviderName: providerName,
        files: [],
      },
      () => {
        resolve(0);
      },
    );
  });
});

afterAll(async () => {
  await app.close();
});

let fileClient: any;

const region = 'us-east-005';
const bucketName = 'test-uploads-bog-juno';
const configId = 0;
const providerName = 'backblazeb2-upload';

const accessKeyId = process.env.accessKeyId;
const secretAccessKey = process.env.secretAccessKey;
const baseURL = process.env.baseURL;

describe('File Service File Upload Tests', () => {
  it('Uploads file correctly', async () => {
    const promise = new Promise((resolve) => {
      fileClient.uploadFile(
        {
          bucketName: bucketName,
          fileName: 'TestFileName',
          providerName: providerName,
          configId: configId,
          region: region,
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
          bucketName: bucketName,
          fileName: 'TestFileDuplicate',
          providerName: providerName,
          configId: configId,
          region: region,
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
          bucketName: bucketName,
          fileName: 'TestFileDuplicate',
          providerName: providerName,
          configId: configId,
          region: region,
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
