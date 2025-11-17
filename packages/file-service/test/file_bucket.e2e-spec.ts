import { DeleteBucketCommand, S3Client } from '@aws-sdk/client-s3';
import {
  BlobServiceClient,
  StorageSharedKeyCredential,
} from '@azure/storage-blob';
import * as GRPC from '@grpc/grpc-js';
import * as ProtoLoader from '@grpc/proto-loader';
import { INestMicroservice } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { Test, TestingModule } from '@nestjs/testing';
import {
  FileBucketProto,
  FileBucketProtoFile,
  FileProviderProto,
  FileProviderProtoFile,
  ResetProtoFile,
} from 'juno-proto';
import { JUNO_FILE_SERVICE_PROVIDER_PACKAGE_NAME } from 'juno-proto/dist/gen/file_provider';
import { JUNO_RESET_DB_PACKAGE_NAME } from 'juno-proto/dist/gen/reset_db';
import { AppModule } from './../src/app.module';

const { JUNO_FILE_SERVICE_BUCKET_PACKAGE_NAME } = FileBucketProto;
const TEST_SERVICE_ADDR = 'file-service:50005';
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
        JUNO_FILE_SERVICE_BUCKET_PACKAGE_NAME,
        JUNO_FILE_SERVICE_PROVIDER_PACKAGE_NAME,
        JUNO_RESET_DB_PACKAGE_NAME,
      ],
      protoPath: [FileBucketProtoFile, FileProviderProtoFile, ResetProtoFile],
      url: TEST_SERVICE_ADDR,
    },
  });

  await app.init();
  await app.listen();

  return app;
}

beforeAll(async () => {
  app = await initApp();
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
        type: FileProviderProto.ProviderType.S3,
      },
      () => resolve(0),
    );
  });

  await new Promise((resolve) => {
    providerClient.createProvider(
      {
        providerName: providerNameAzure,
        accessKey: JSON.stringify({ accountName, accountKey }),
        metadata: JSON.stringify({ endpoint: '' }), // doesn't matter for azure
        bucket: [],
        type: FileProviderProto.ProviderType.AZURE,
      },
      () => resolve(0),
    );
  });

  const bucketProto = ProtoLoader.loadSync([FileBucketProtoFile]);
  const bucketProtoGRPC = GRPC.loadPackageDefinition(bucketProto) as any;
  bucketClientDB = new bucketProtoGRPC.juno.file_service.bucket.BucketDbService(
    process.env.DB_SERVICE_ADDR,
    GRPC.credentials.createInsecure(),
  );

  bucketClient = new bucketProtoGRPC.juno.file_service.bucket.BucketFileService(
    TEST_SERVICE_ADDR,
    GRPC.credentials.createInsecure(),
  );

  await new Promise((resolve) => {
    bucketClientDB.createBucket(
      {
        name: bucketName,
        configId,
        configEnv,
        fileProviderName: providerName,
        files: [],
      },
      () => resolve(0),
    );
  });
});

afterAll(async () => {
  await app.close();
  const metadata = {
    endpoint: baseURL,
    region: region,
    credentials: {
      accessKeyId: accessKeyId as string,
      secretAccessKey: secretAccessKey as string,
    },
  };
  const client = new S3Client(metadata);
  const command = new DeleteBucketCommand({
    Bucket: `${bucketName}-${configId}-${configEnv}`,
  });
  await client.send(command);
});

let bucketClientDB: any;
let bucketClient: any;
const bucketName = 'test-bucket-juno-buckets';
const configId = 0;
const configEnv = 'prod';
const providerName = 'backblazeb2-buckets';
const providerNameAzure = 'azure-buckets';

const accessKeyId = process.env.accessKeyId;
const secretAccessKey = process.env.secretAccessKey;
const baseURL = process.env.baseURL;
const region = 'us-east-005';
const accountName = process.env.azureStorageAccountName;
const accountKey = process.env.azureStorageAccountKey;

describe('File Bucket Creation Tests', () => {
  it('Successfully creates a bucket - S3', async () => {
    const metadata = {
      endpoint: baseURL,
      region: region,
      credentials: {
        accessKeyId: accessKeyId as string,
        secretAccessKey: secretAccessKey as string,
      },
    };

    const client = new S3Client(metadata);
    const command = new DeleteBucketCommand({
      Bucket: `successful-bucket-${configId}-${configEnv}`,
    });
    // Delete in case it already exists

    try {
      await client.send(command);
    } catch {}

    const createBucketPromise = new Promise((resolve, reject) => {
      bucketClient.registerBucket(
        {
          name: 'successful-bucket',
          configId,
          configEnv,
          fileProviderName: providerName,
        },
        (err: any) => {
          if (err) {
            return reject(err);
          }
          expect(err).toBeNull();
          resolve(0);
        },
      );
    });
    await createBucketPromise;

    await client.send(command);
  });

  it('Successfully creates a bucket - Azure', async () => {
    const sharedKeyCredential = new StorageSharedKeyCredential(
      accountName ?? '',
      accountKey ?? '',
    );
    const client = new BlobServiceClient(
      `https://${accountName}.blob.core.windows.net`,
      sharedKeyCredential,
    );

    const createBucketPromise = new Promise((resolve, reject) => {
      bucketClient.registerBucket(
        {
          name: 'successful-bucket-Azure',
          configId,
          configEnv,
          fileProviderName: providerNameAzure,
        },
        (err: any) => {
          if (err) {
            return reject(err);
          }
          expect(err).toBeNull();
          resolve(0);
        },
      );
    });
    await createBucketPromise;

    await client
      .getContainerClient(`successful-bucket-Azure-${configId}-${configEnv}`)
      .delete();
  });

  it('Fails to create a bucket with invalid provider', async () => {
    const createBucketPromise = new Promise((resolve) => {
      bucketClient.registerBucket(
        {
          name: bucketName,
          configId,
          configEnv,
          fileProviderName: 'invalidProvider',
        },
        (err: any) => {
          expect(err).not.toBeNull();
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
          configEnv,
          fileProviderName: providerName,
        },
        (err: any) => {
          expect(err).not.toBeNull();
          resolve({});
        },
      );
    });
    await createBucketPromise2;
  });
});
