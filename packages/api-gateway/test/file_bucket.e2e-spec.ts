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
  FileBucketProto,
  ResetProtoFile,
  FileProviderProtoFile,
} from 'juno-proto';
import * as GRPC from '@grpc/grpc-js';
import * as ProtoLoader from '@grpc/proto-loader';

let app: INestApplication;
const ADMIN_EMAIL = 'test-superadmin@test.com';
const ADMIN_PASSWORD = 'test-password';
let apiKey: string | undefined = undefined;

const accessKeyId = process.env.accessKeyId;
const secretAccessKey = process.env.secretAccessKey;
const baseURL = process.env.baseURL;
const providerName = 'backblazeb2-upload';

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
  await new Promise((resolve, reject) => {
    resetClient.resetDb({}, (err: any) => {
      if (err) return reject(err);
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

  await new Promise((resolve, reject) => {
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
      (err: any) => {
        if (err) return reject(err);
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

describe('File Bucket Routes', () => {
  let uniqueBucketName: string;

  beforeEach(() => {
    uniqueBucketName = `Test Bucket ${Date.now()}`;
  });

  it('Creating a bucket successfully', async () => {
    const fileBucketBody: FileBucketProto.RegisterBucketRequest = {
      name: uniqueBucketName,
      configId: 1,
      fileProviderName: 'Test Provider',
      FileServiceFile: [],
    };

    return request(app.getHttpServer())
      .post('/file/bucket')
      .set('Authorization', 'Bearer ' + apiKey)
      .send(fileBucketBody)
      .expect(201);
  });

  it('Unsuccessful creation due to missing bucket name', async () => {
    const fileBucketBody: FileBucketProto.RegisterBucketRequest = {
      name: '',
      configId: 1,
      fileProviderName: 'Test Provider',
      FileServiceFile: [],
    };

    return request(app.getHttpServer())
      .post('/file/bucket')
      .set('Authorization', 'Bearer ' + apiKey)
      .send(fileBucketBody)
      .expect(400);
  });

  it('Unsuccessful creation due to missing config ID', async () => {
    const fileBucketBody: FileBucketProto.RegisterBucketRequest = {
      name: uniqueBucketName,
      configId: undefined,
      fileProviderName: 'Test Provider',
      FileServiceFile: [],
    };

    return request(app.getHttpServer())
      .post('/file/bucket')
      .set('Authorization', 'Bearer ' + apiKey)
      .send(fileBucketBody)
      .expect(400);
  });

  it('Unsuccessful creation due to missing file provider name', async () => {
    const fileBucketBody: FileBucketProto.RegisterBucketRequest = {
      name: uniqueBucketName,
      configId: 1,
      fileProviderName: '',
      FileServiceFile: [],
    };

    return request(app.getHttpServer())
      .post('/file/bucket')
      .set('Authorization', 'Bearer ' + apiKey)
      .send(fileBucketBody)
      .expect(400);
  });

  it('Creating an existing bucket (should fail)', async () => {
    const fileBucketBody: FileBucketProto.RegisterBucketRequest = {
      name: uniqueBucketName,
      configId: 1,
      fileProviderName: 'Test Provider',
      FileServiceFile: [],
    };

    await request(app.getHttpServer())
      .post('/file/bucket')
      .set('Authorization', 'Bearer ' + apiKey)
      .send(fileBucketBody)
      .expect(201);

    return request(app.getHttpServer())
      .post('/file/bucket')
      .set('Authorization', 'Bearer ' + apiKey)
      .send(fileBucketBody)
      .expect(409);
  });
});
