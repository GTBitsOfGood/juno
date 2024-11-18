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

const { JUNO_FILE_SERVICE_BUCKET_PACKAGE_NAME } = FileBucketProto;
const TEST_SERVICE_ADDR = 'file-service:50004';
let app: INestMicroservice;

jest.setTimeout(10000);

async function initApp() {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: [JUNO_FILE_SERVICE_BUCKET_PACKAGE_NAME],
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
  let bucketClientDB: any;
  let bucketClient: any;
  const bucketName = 'test-bucket-juno';
  const configId = 1;
  const providerName = 'backblazeb2';

  const accessKeyId = process.env.accessKeyId;
  const secretAccessKey = process.env.secretAccessKey;
  const baseURL = process.env.baseURL;

  beforeEach(async () => {
    // Load Reset Proto
    const resetProto = ProtoLoader.loadSync([ResetProtoFile]);
    const resetProtoGRPC = GRPC.loadPackageDefinition(resetProto) as any;
    const resetClient = new resetProtoGRPC.juno.reset_db.DatabaseReset(
      process.env.DB_SERVICE_ADDR,
      GRPC.credentials.createInsecure(),
    );

    await new Promise((resolve) => {
      resetClient.resetDb({}, () => resolve(0));
    });

    const providerProto = ProtoLoader.loadSync([FileProviderProtoFile]);
    const providerProtoGRPC = GRPC.loadPackageDefinition(providerProto) as any;
    const providerClient =
      new providerProtoGRPC.juno.file_service.provider.FileProviderDbService(
        process.env.DB_SERVICE_ADDR,
        GRPC.credentials.createInsecure(),
      );

    await new Promise((resolve) => {
      providerClient.createProvider(
        {
          providerName,
          accessKey: JSON.stringify({ accessKeyId, secretAccessKey }),
          metadata: JSON.stringify({ endpoint: baseURL }),
          bucket: [],
        },
        () => resolve(0),
      );
    });

    const bucketProto = ProtoLoader.loadSync([FileBucketProtoFile]);
    const bucketProtoGRPC = GRPC.loadPackageDefinition(bucketProto) as any;
    bucketClientDB =
      new bucketProtoGRPC.juno.file_service.bucket.BucketDbService(
        process.env.DB_SERVICE_ADDR,
        GRPC.credentials.createInsecure(),
      );

    bucketClient =
      new bucketProtoGRPC.juno.file_service.bucket.BucketFileService(
        process.env.FILE_SERVICE_ADDR,
        GRPC.credentials.createInsecure(),
      );

    await new Promise((resolve) => {
      bucketClientDB.createBucket(
        {
          name: bucketName,
          configId,
          fileProviderName: providerName,
          files: [],
        },
        () => resolve(0),
      );
    });
  });

  it('Successfully creates a bucket', async () => {
    const createBucketPromise = new Promise((resolve, reject) => {
      bucketClient.registerBucket(
        {
          name: bucketName,
          configId,
          fileProviderName: providerName,
        },
        (err: any, response: any) => {
          if (err) {
            return reject(err);
          }
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
          configId,
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
    const createBucketPromise2 = new Promise((resolve) => {
      bucketClient.registerBucket(
        {
          name: bucketName,
          configId,
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
