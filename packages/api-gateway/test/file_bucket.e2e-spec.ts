import { DeleteBucketCommand, S3Client } from '@aws-sdk/client-s3';
import * as GRPC from '@grpc/grpc-js';
import * as ProtoLoader from '@grpc/proto-loader';
import {
  ClassSerializerInterceptor,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import {
  FileProviderProto,
  FileProviderProtoFile,
  ResetProtoFile,
} from 'juno-proto';
import { RpcExceptionFilter } from 'src/rpc_exception_filter';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

let app: INestApplication;
const ADMIN_EMAIL = 'test-superadmin@test.com';
const ADMIN_PASSWORD = 'test-password';
let apiKey: string | undefined = undefined;
const region = 'us-east-005';

const accessKeyId = process.env.accessKeyId;
const secretAccessKey = process.env.secretAccessKey;
const baseURL = process.env.baseURL;
const providerName = 'backblazeb2-upload';

jest.setTimeout(10000);

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
  app.useGlobalFilters(new RpcExceptionFilter());
  await app.init();

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
        type: FileProviderProto.ProviderType.S3,
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
  if (!apiKey) {
    apiKey = await APIKeyForProjectName('test-seed-project');
  }
});

describe('File Bucket Routes', () => {
  let uniqueBucketName: string;

  beforeEach(() => {
    uniqueBucketName = `Bucket-${Date.now()}`;
  });

  it('Creating a bucket successfully', async () => {
    const fileBucketBody = {
      name: uniqueBucketName,
      configId: 0,
      fileProviderName: providerName,
      FileServiceFile: [],
    };

    await request(app.getHttpServer())
      .post('/file/bucket')
      .set('Authorization', 'Bearer ' + apiKey)
      .send(fileBucketBody)
      .expect(201);

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
      Bucket: `${uniqueBucketName}-0-prod`,
    });

    await client.send(command);
  });

  it('Unsuccessful creation due to missing bucket name', async () => {
    const fileBucketBody = {
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
    const fileBucketBody = {
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
    const fileBucketBody = {
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
    const fileBucketBody = {
      name: uniqueBucketName + '-duplicate',
      configId: 0,
      fileProviderName: providerName,
      FileServiceFile: [],
    };

    await request(app.getHttpServer())
      .post('/file/bucket')
      .set('Authorization', 'Bearer ' + apiKey)
      .send(fileBucketBody)
      .expect(201);

    await request(app.getHttpServer())
      .post('/file/bucket')
      .set('Authorization', 'Bearer ' + apiKey)
      .send(fileBucketBody)
      .expect(400);

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
      Bucket: uniqueBucketName + '-duplicate-0-prod',
    });

    await client.send(command);
  });
});
