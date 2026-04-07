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
  FileProviderProto,
} from 'juno-proto';
import { AppModule } from './../src/app.module';

const { JUNO_FILE_SERVICE_FILE_PACKAGE_NAME } = FileProto;

let app: INestMicroservice;

const TEST_SERVICE_ADDR = 'file-service:50003';

jest.setTimeout(15000);

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

let fileClient: any;

const bucketName = 'test-delete-bog-juno';
const configId = 0;
const configEnv = 'prod';
const providerName = 'backblazeb2-delete';
const providerNameAzure = 'azure-delete';

const accessKeyId = process.env.accessKeyId;
const secretAccessKey = process.env.secretAccessKey;
const baseURL = process.env.baseURL;
const accountName = process.env.azureStorageAccountName;
const accountKey = process.env.azureStorageAccountKey;

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
        metadata: JSON.stringify({ endpoint: '' }),
        bucket: [],
        type: FileProviderProto.ProviderType.AZURE,
      },
      () => resolve(0),
    );
  });

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
        configId,
        configEnv,
        fileProviderName: providerName,
        files: [],
      },
      () => resolve(0),
    );
  });

  await new Promise((resolve) => {
    bucketClient.createBucket(
      {
        name: bucketName + '-azure',
        configId,
        configEnv,
        fileProviderName: providerNameAzure,
        files: [],
      },
      () => resolve(0),
    );
  });
});

afterAll(async () => {
  await app.close();
});

describe('File Service Delete Files Tests', () => {
  it('Fails to delete with missing bucketName', async () => {
    const promise = new Promise((resolve) => {
      fileClient.deleteFiles(
        {
          bucketName: '',
          configId,
          configEnv,
          fileNames: ['SomeFile'],
        },
        (err: any) => {
          expect(err).not.toBeNull();
          resolve({});
        },
      );
    });

    await promise;
  });

  it('Fails to delete with empty fileNames', async () => {
    const promise = new Promise((resolve) => {
      fileClient.deleteFiles(
        {
          bucketName,
          configId,
          configEnv,
          fileNames: [],
        },
        (err: any) => {
          expect(err).not.toBeNull();
          resolve({});
        },
      );
    });

    await promise;
  });

  it('Deletes files correctly - S3', async () => {
    // Upload a file first
    await new Promise((resolve) => {
      fileClient.uploadFile(
        {
          bucketName,
          fileName: 'FileToDelete',
          providerName,
          configId,
          configEnv,
          region: 'us-east-005',
        },
        (err: any) => {
          expect(err).toBeNull();
          resolve({});
        },
      );
    });

    // Now delete it
    const promise = new Promise((resolve) => {
      fileClient.deleteFiles(
        {
          bucketName,
          configId,
          configEnv,
          fileNames: ['FileToDelete'],
        },
        (err: any, response: any) => {
          expect(err).toBeNull();
          expect(response.bucketName).toBe(bucketName);
          expect(response.fileNames).toContain('FileToDelete');
          resolve({});
        },
      );
    });

    await promise;
  });

  it('Deletes files correctly - Azure', async () => {
    // Upload a file first
    await new Promise((resolve) => {
      fileClient.uploadFile(
        {
          bucketName: bucketName + '-azure',
          fileName: 'FileToDeleteAzure',
          providerName: providerNameAzure,
          configId,
          configEnv,
          region: 'us-east-005',
        },
        (err: any) => {
          expect(err).toBeNull();
          resolve({});
        },
      );
    });

    // Now delete it
    const promise = new Promise((resolve) => {
      fileClient.deleteFiles(
        {
          bucketName: bucketName + '-azure',
          configId,
          configEnv,
          fileNames: ['FileToDeleteAzure'],
        },
        (err: any, response: any) => {
          expect(err).toBeNull();
          expect(response.bucketName).toBe(bucketName + '-azure');
          expect(response.fileNames).toContain('FileToDeleteAzure');
          resolve({});
        },
      );
    });

    await promise;
  });
});
