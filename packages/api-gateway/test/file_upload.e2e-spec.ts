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
  ResetProtoFile,
  FileProviderProtoFile,
  FileBucketProtoFile,
} from 'juno-proto';
import * as GRPC from '@grpc/grpc-js';
import * as ProtoLoader from '@grpc/proto-loader';

let app: INestApplication;
const ADMIN_EMAIL = 'test-superadmin@test.com';
const ADMIN_PASSWORD = 'test-password';
let apiKey: string | undefined = undefined;

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

  // Create sample provider
  const providerProto = ProtoLoader.loadSync([FileProviderProtoFile]) as any;
  const providerProtoGRPC = GRPC.loadPackageDefinition(providerProto) as any;
  const providerClient =
    new providerProtoGRPC.juno.file_service.provider.FileProviderDbService(
      process.env.DB_SERVICE_ADDR,
      GRPC.credentials.createInsecure(),
    );

  console.log(configId);
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

const region = 'us-east-005';
const bucketName = 'test-uploads-bog-juno';
const configId = 0;
const providerName = 'backblazeb2-upload';
const fileName = 'TestFile';

const accessKeyId = process.env.accessKeyId;
const secretAccessKey = process.env.secretAccessKey;
const baseURL = process.env.baseURL;

describe('File Upload Verification Routes', () => {
  it('Upload file without auth key', () => {
    const fileUploadBody = {
      fileName: fileName,
      bucketName: bucketName,
      providerName: providerName,
      configId: configId,
      region: region,
    };

    return request(app.getHttpServer())
      .post('/file/upload')
      .send(fileUploadBody)
      .expect(401);
  });

  it('Missing fileName with auth key', () => {
    const fileUploadBody = {
      fileName: '',
      bucketName: bucketName,
      providerName: providerName,
      configId: configId,
      region: region,
    };

    return request(app.getHttpServer())
      .post('/file/upload')
      .set('Authorization', 'Bearer ' + apiKey)
      .send(fileUploadBody)
      .expect(400);
  });

  it('Missing bucketName with auth key', () => {
    const fileUploadBody = {
      fileName: fileName,
      bucketName: '',
      providerName: providerName,
      configId: configId,
      region: region,
    };

    return request(app.getHttpServer())
      .post('/file/upload')
      .set('Authorization', 'Bearer ' + apiKey)
      .send(fileUploadBody)
      .expect(400);
  });

  it('Missing providerName with auth key', () => {
    const fileUploadBody = {
      fileName: fileName,
      bucketName: bucketName,
      providerName: '',
      configId: configId,
      region: region,
    };

    return request(app.getHttpServer())
      .post('/file/upload')
      .set('Authorization', 'Bearer ' + apiKey)
      .send(fileUploadBody)
      .expect(400);
  });

  it('Negative configId with auth key', () => {
    const fileUploadBody = {
      fileName: fileName,
      bucketName: bucketName,
      providerName: providerName,
      configId: -1,
      region: region,
    };

    return request(app.getHttpServer())
      .post('/file/upload')
      .set('Authorization', 'Bearer ' + apiKey)
      .send(fileUploadBody)
      .expect(400);
  });

  it('Empty string region with auth key', () => {
    const fileUploadBody = {
      fileName: fileName,
      bucketName: bucketName,
      providerName: providerName,
      configId: configId,
      region: '',
    };

    return request(app.getHttpServer())
      .post('/file/upload')
      .set('Authorization', 'Bearer ' + apiKey)
      .send(fileUploadBody)
      .expect(400);
  });

  it('Successful file upload with auth key', () => {
    const fileUploadBody = {
      fileName: fileName,
      bucketName: bucketName,
      providerName: providerName,
      configId: configId,
      region: region,
    };

    return request(app.getHttpServer())
      .post('/file/upload')
      .set('Authorization', 'Bearer ' + apiKey)
      .send(fileUploadBody)
      .expect(201);
  });

  it('Duplicate file upload with auth key', () => {
    const fileUploadBody = {
      fileName: fileName,
      bucketName: bucketName,
      providerName: providerName,
      configId: configId,
      region: region,
    };

    return request(app.getHttpServer())
      .post('/file/upload')
      .set('Authorization', 'Bearer ' + apiKey)
      .send(fileUploadBody)
      .expect(500);
  });
});
