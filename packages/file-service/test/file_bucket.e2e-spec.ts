import { INestMicroservice } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { Test, TestingModule } from '@nestjs/testing';
import * as ProtoLoader from '@grpc/proto-loader';
import * as GRPC from '@grpc/grpc-js';
import {
  FileBucketProtoFile,
  ResetProtoFile,
  FileProviderProtoFile,
  FileBucketProto,
} from 'juno-proto';
import { AppModule } from './../src/app.module';

const { JUNO_FILE_SERVICE_FILE_PACKAGE_NAME } = FileBucketProto;
const TEST_SERVICE_ADDR = 'file-service:50003';
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
      protoPath: [FileBucketProtoFile],
      url: TEST_SERVICE_ADDR,
    },
  });

  await app.init();
  await app.listen();

  return app;
}

beforeAll(async () => {
  app = await initApp();
});

afterAll(async () => {
  await app.close();
});

describe('File Bucket Creation Tests', () => {
  let bucketClient: any;
  const bucketName = 'test-bucket-juno';
  const configId = 1;
  const providerName = 'backblazeb2';

  const accessKeyId = process.env.accessKeyId;
  const secretAccessKey = process.env.secretAccessKey;
  const baseURL = process.env.baseURL;

  beforeEach(async () => {
    const proto = ProtoLoader.loadSync([FileBucketProtoFile]) as any;
    const protoGRPC = GRPC.loadPackageDefinition(proto) as any;

    bucketClient = new protoGRPC.juno.file_service.bucket.BucketService(
      TEST_SERVICE_ADDR,
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

    const bucketProto = ProtoLoader.loadSync([FileBucketProtoFile]) as any;
    const bucketProtoGRPC = GRPC.loadPackageDefinition(bucketProto) as any;
    const bucketDbClient =
      new bucketProtoGRPC.juno.file_service.bucket.BucketDbService(
        process.env.DB_SERVICE_ADDR,
        GRPC.credentials.createInsecure(),
      );

    await new Promise((resolve) => {
      bucketDbClient.createBucket(
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

  it('Successfully creates a bucket', async () => {
    const createBucketPromise = new Promise((resolve) => {
      bucketClient.registerBucket(
        {
          name: bucketName,
          configId: configId,
          fileProviderName: providerName,
        },
        (err: any, response: any) => {
          expect(err).toBeNull();
          expect(response).toHaveProperty('success', true);
          resolve({});
        },
      );
    });
    await createBucketPromise;
  });

  it('Fails to create a bucket with invalid provider', async () => {
    const createBucketPromise = new Promise((resolve) => {
      bucketClient.registerBucket(
        {
          name: bucketName,
          configId: configId,
          fileProviderName: 'invalidProvider',
        },
        (err: any) => {
          expect(err).not.toBeNull();
          expect(err.message).toContain('Provider not found');
          resolve({});
        },
      );
    });
    await createBucketPromise;
  });

  it('Fails to create an already existing bucket', async () => {
    const createBucketPromise1 = new Promise((resolve) => {
      bucketClient.registerBucket(
        {
          name: bucketName,
          configId: configId,
          fileProviderName: providerName,
        },
        (err: any, response: any) => {
          expect(err).toBeNull();
          expect(response).toHaveProperty('success', true);
          resolve({});
        },
      );
    });
    await createBucketPromise1;

    const createBucketPromise2 = new Promise((resolve) => {
      bucketClient.registerBucket(
        {
          name: bucketName,
          configId: configId,
          fileProviderName: providerName,
        },
        (err: any) => {
          expect(err).not.toBeNull();
          expect(err.message).toContain('Bucket already exists');
          resolve({});
        },
      );
    });
    await createBucketPromise2;
  });
});