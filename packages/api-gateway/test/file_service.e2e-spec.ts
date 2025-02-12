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
  FileConfigProtoFile,
  FileConfigProto,
} from 'juno-proto';
import * as GRPC from '@grpc/grpc-js';
import * as ProtoLoader from '@grpc/proto-loader';
import { DeleteBucketCommand, S3Client } from '@aws-sdk/client-s3';

let app: INestApplication;
const ADMIN_EMAIL = 'test-superadmin@test.com';
const ADMIN_PASSWORD = 'test-password';
const projectName = 'file-service-api-gateway-test';
let projectId: number;
let apiKey: string;
let uniqueBucketName: string;
let providerName: string;
let fileName: string;

interface AssertAPIRequestInput {
  url: string;
  apiKey: string;
  data: any;
  expectStatus: number;
}

interface S3ClientMetadata {
  endpoint: string;
  region: string;
  credentials: {
    accessKeyId: string;
    secretAccessKey: string;
  };
}

// TODO: use api-gateway endpoint testing once available
async function registerConfig(projectId: number): Promise<any> {
  const configProto = ProtoLoader.loadSync([FileConfigProtoFile]) as any;
  const configProtoGRPC = GRPC.loadPackageDefinition(configProto) as any;
  const configClient =
    new configProtoGRPC.juno.file_service.config.FileServiceConfigDbService(
      process.env.DB_SERVICE_ADDR,
      GRPC.credentials.createInsecure(),
    );

  const config: FileConfigProto.FileServiceConfig = await new Promise(
    (resolve) => {
      configClient.createConfig(
        { projectId: projectId, environment: 'prod', buckets: [], files: [] },
        (err, res) => {
          if (err) resolve(null);
          else resolve(res);
        },
      );
    },
  );
  return config && config.id;
}

async function assertAPIRequest(input: AssertAPIRequestInput) {
  await request(app.getHttpServer())
    .post(input.url)
    .set('Authorization', 'Bearer ' + input.apiKey)
    .send(input.data)
    .expect(input.expectStatus);
}

async function createAPIKeyForProjectName(
  projectName: string,
): Promise<string> {
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

async function createProject(projectName: string): Promise<number> {
  const project = await request(app.getHttpServer())
    .post('/project')
    .set('X-User-Email', ADMIN_EMAIL)
    .set('X-User-Password', ADMIN_PASSWORD)
    .send({
      name: projectName,
    });
  return project.body.id;
}

async function deleteS3BucketPostTest(
  bucketName: string,
  s3ClientMetadata: S3ClientMetadata,
) {
  const client = new S3Client(s3ClientMetadata);
  const command = new DeleteBucketCommand({ Bucket: bucketName });
  await client.send(command);
}

async function resetDB() {
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

  await app.init();
});

afterAll((done) => {
  app.close();
  done();
});

const region = 'us-east-005';
const accessKeyId = process.env.accessKeyId;
const secretAccessKey = process.env.secretAccessKey;
const baseURL = process.env.baseURL;

describe('File Upload Verification Routes', () => {
  beforeEach(async () => {
    await resetDB();
    projectId = await createProject(projectName);
    apiKey = await createAPIKeyForProjectName(projectName);

    uniqueBucketName = `Bucket-${Date.now()}`;
    providerName = `Provider-${Date.now()}`;
    fileName = `File-${Date.now()}`;
  });

  afterEach(async () => {
    try {
      await deleteS3BucketPostTest(uniqueBucketName, {
        endpoint: baseURL,
        region: region,
        credentials: {
          accessKeyId: accessKeyId as string,
          secretAccessKey: secretAccessKey as string,
        },
      });
    } catch (err) {
      console.log(err.message);
    }
  });

  it('Successful upload/download file', async () => {
    // Register file config
    const configIdLong = await registerConfig(projectId);
    expect(configIdLong).toBeDefined;
    const configId = Number(configIdLong);

    // Register file provider
    await assertAPIRequest({
      url: '/file/provider',
      apiKey: apiKey,
      data: {
        providerName: providerName,
        accessKey: {
          publicAccessKey: accessKeyId,
          privateAccessKey: secretAccessKey,
        },
        baseUrl: baseURL,
        type: 'S3',
      },
      expectStatus: 201,
    });

    // Create bucket
    await assertAPIRequest({
      url: '/file/bucket',
      apiKey: apiKey,
      data: {
        name: uniqueBucketName,
        configId: configId,
        fileProviderName: providerName,
        FileServiceFile: [],
      },
      expectStatus: 201,
    });

    // Upload file
    await assertAPIRequest({
      url: '/file/upload',
      apiKey: apiKey,
      data: {
        fileName: fileName,
        bucketName: uniqueBucketName,
        providerName: providerName,
        configId: configId,
        region: region,
      },
      expectStatus: 201,
    });

    // Download file
    await assertAPIRequest({
      url: '/file/download',
      apiKey: apiKey,
      data: {
        bucketName: uniqueBucketName,
        configId: configId,
        fileName: fileName,
        providerName: providerName,
      },
      expectStatus: 201,
    });
  });

  it('Fail to register config', async () => {
    // Register file config failed because projectId is -1 does not exist
    const configId = await registerConfig(-1);
    expect(configId).not.toBeDefined;

    // Register file provider successfully because it does not involve config
    await assertAPIRequest({
      url: '/file/provider',
      apiKey: apiKey,
      data: {
        providerName: providerName,
        accessKey: {
          publicAccessKey: accessKeyId,
          privateAccessKey: secretAccessKey,
        },
        baseUrl: baseURL,
        type: 'S3',
      },
      expectStatus: 201,
    });

    // Create bucket failed because config is undefined
    await assertAPIRequest({
      url: '/file/bucket',
      apiKey: apiKey,
      data: {
        name: uniqueBucketName,
        configId: configId,
        fileProviderName: providerName,
        FileServiceFile: [],
      },
      expectStatus: 400,
    });

    // Upload file failed because config is undefine
    await assertAPIRequest({
      url: '/file/upload',
      apiKey: apiKey,
      data: {
        fileName: fileName,
        bucketName: uniqueBucketName,
        providerName: providerName,
        configId: configId,
        region: region,
      },
      expectStatus: 400,
    });

    // Download file failed because config is undefine
    await assertAPIRequest({
      url: '/file/download',
      apiKey: apiKey,
      data: {
        bucketName: uniqueBucketName,
        configId: configId,
        fileName: fileName,
        providerName: providerName,
      },
      expectStatus: 400,
    });
  });

  it('Fail to register provider', async () => {
    // Register file config successfully
    const configIdLong = await registerConfig(projectId);
    expect(configIdLong).toBeDefined;
    const configId = configIdLong.low;

    const invalidProviderName = '';

    // Fail to register file provider
    await assertAPIRequest({
      url: '/file/provider',
      apiKey: apiKey,
      data: {
        providerName: invalidProviderName,
        accessKey: {
          publicAccessKey: accessKeyId,
          privateAccessKey: secretAccessKey,
        },
        baseUrl: baseURL,
        type: 'S3',
      },
      expectStatus: 400,
    });

    // Create bucket failed
    await assertAPIRequest({
      url: '/file/bucket',
      apiKey: apiKey,
      data: {
        name: uniqueBucketName,
        configId: configId,
        fileProviderName: invalidProviderName,
        FileServiceFile: [],
      },
      expectStatus: 400,
    });

    // Upload file failed
    await assertAPIRequest({
      url: '/file/upload',
      apiKey: apiKey,
      data: {
        fileName: fileName,
        bucketName: uniqueBucketName,
        providerName: invalidProviderName,
        configId: configId,
        region: region,
      },
      expectStatus: 400,
    });

    // Download file failed
    await assertAPIRequest({
      url: '/file/download',
      apiKey: apiKey,
      data: {
        bucketName: uniqueBucketName,
        configId: configId,
        fileName: fileName,
        providerName: invalidProviderName,
      },
      expectStatus: 400,
    });
  });
});
