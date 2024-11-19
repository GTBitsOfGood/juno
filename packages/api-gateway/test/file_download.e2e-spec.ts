import { Test, TestingModule } from '@nestjs/testing';
import {
  ClassSerializerInterceptor,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { AppModule } from './../src/app.module';
import { Reflector } from '@nestjs/core';
import * as request from 'supertest';
import {
  FileProtoFile,
  FileProviderProtoFile,
  FileBucketProtoFile,
  ResetProtoFile,
} from 'juno-proto';
import * as GRPC from '@grpc/grpc-js';
import * as ProtoLoader from '@grpc/proto-loader';

let app: INestApplication;
const ADMIN_EMAIL = 'test-superadmin@test.com';
const ADMIN_PASSWORD = 'test-password';
let apiKey: string | undefined = undefined;

const bucketName = 'test-downloads-bog-juno';
const configId = 0;
const providerName = 'backblazeb2-download';
const validFile = 'valid-file';
const invalidFile = 'invalid-file';

const accessKeyId = process.env.accessKeyId;
const secretAccessKey = process.env.secretAccessKey;
const baseURL = process.env.baseURL;

async function APIKeyForProjectName(projectName: string): Promise<string> {
  const key = await request(app.getHttpServer())
    .post('/auth/key')
    .set('X-User-Email', ADMIN_EMAIL)
    .set('X-User-Password', ADMIN_PASSWORD)
    .send({
      environment: 'prod',
      project: {
        name: projectName,
      },
    });

  return key.body['apiKey'];
}

beforeAll(async () => {
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

  const providerProto = ProtoLoader.loadSync([FileProviderProtoFile]) as any;
  const providerProtoGRPC = GRPC.loadPackageDefinition(providerProto) as any;
  const providerClient =
    new providerProtoGRPC.juno.file_service.provider.FileProviderDbService(
      process.env.DB_SERVICE_ADDR,
      GRPC.credentials.createInsecure(),
    );

  // create provider
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

  // Create bucket
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

  //create file
  const fileDbClient = new fileProtoGRPC.juno.file_service.file.FileDbService(
    process.env.DB_SERVICE_ADDR,
    GRPC.credentials.createInsecure(),
  );
  await new Promise((resolve) => {
    fileDbClient.createFile(
      {
        fileId: {
          bucketName: bucketName,
          configId: configId,
          path: validFile,
        },
        metadata: '',
      },
      () => {
        resolve(0);
      },
    );
  });
});

afterAll((done) => {
  app.close();
  done();
});

beforeEach(async () => {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  app = moduleFixture.createNestApplication();
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
    }),
  );
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  await app.init();

  if (!apiKey) {
    apiKey = await APIKeyForProjectName('test-seed-project');
  }
});

describe('File Download Verification Routes', () => {
  it('downloads file with api key', async () => {
    const req = {
      bucketName: bucketName,
      configId: configId,
      fileName: validFile,
      providerName: providerName,
    };

    return request(app.getHttpServer())
      .post('/file/download')
      .set('Authorization', 'Bearer ' + apiKey)
      .send(req)
      .expect(200);
  });
  it('downloads file without api key', async () => {
    const req = {
      bucketName: bucketName,
      configId: configId,
      fileName: validFile,
      providerName: providerName,
    };

    return request(app.getHttpServer())
      .post('/file/download')
      .send(req)
      .expect(401);
  });
  it('downloads file with that does not exist', async () => {
    const req = {
      bucketName: bucketName,
      configId: configId,
      fileName: invalidFile,
      providerName: providerName,
    };

    return request(app.getHttpServer())
      .post('/file/download')
      .set('Authorization', 'Bearer ' + apiKey)
      .send(req)
      .expect(404);
  });
});
