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

let app: INestApplication;
const ADMIN_EMAIL = 'test-superadmin@test.com';
const ADMIN_PASSWORD = 'test-password';
const projectName = 'file-service-api-gateway-test';
let projectId: number;
let apiKey: string;

interface AssertAPIRequestInput {
  url: string;
  apiKey: string;
  data: any;
  expectStatus: number;
}

// Will use api-gateway endpoint testing once available
async function registerConfig(projectId: number): Promise<number> {
  const configProto = ProtoLoader.loadSync([FileConfigProtoFile]) as any;
  const configProtoGRPC = GRPC.loadPackageDefinition(configProto) as any;
  const configClient =
    new configProtoGRPC.juno.file_service.config.FileServiceConfigDbService(
      process.env.DB_SERVICE_ADDR,
      GRPC.credentials.createInsecure(),
    );

  const config: FileConfigProto.FileServiceConfig = await new Promise(
    (resolve, reject) => {
      configClient.createConfig(
        { projectId: projectId, buckets: [], files: [] },
        (err, res) => {
          if (err) reject(new Error('ConfigRegistrationError'));
          else resolve(res);
        },
      );
    },
  );
  return config.id;
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
    apiKey = await createAPIKeyForProjectName('test-seed-project');
  }
  if (!projectId && projectId != 0) {
    projectId = await createProject(projectName);
  }
});

const region = 'us-east-005';
const bucketName = 'test-uploads-bog-juno';
const providerName = 'backblazeb2-upload';
const fileName = 'TestFileServiceE2E';

const accessKeyId = process.env.accessKeyId;
const secretAccessKey = process.env.secretAccessKey;
const baseURL = process.env.baseURL;

describe('File Upload Verification Routes', () => {
  it('Successful upload/download file', async () => {
    // Register file config
    const configId = await registerConfig(projectId);
    expect(configId).toBeDefined;

    // Register file provider
    assertAPIRequest({
      url: '/file/provider',
      apiKey: apiKey,
      data: {
        providerName: providerName,
        accessKey: {
          publicAccessKey: accessKeyId,
          privateAccessKey: secretAccessKey,
        },
        baseUrl: baseURL,
      },
      expectStatus: 201,
    });

    // Create bucket
    assertAPIRequest({
      url: '/file/bucket',
      apiKey: apiKey,
      data: {
        name: bucketName,
        configId: configId,
        fileProviderName: providerName,
        FileServiceFile: [],
      },
      expectStatus: 201,
    });

    // Upload file
    assertAPIRequest({
      url: '/file/upload',
      apiKey: apiKey,
      data: {
        fileName: fileName,
        bucketName: bucketName,
        providerName: providerName,
        configId: configId,
        region: region,
      },
      expectStatus: 201,
    });

    // Download file
    assertAPIRequest({
      url: '/file/download',
      apiKey: apiKey,
      data: {
        bucketName: bucketName,
        configId: configId,
        fileName: fileName,
        providerName: providerName,
      },
      expectStatus: 201,
    });
  });

  it('Fail to register config', async () => {
    // Register file config failed because projectId is -1 does not exist
    let configId;
    try {
      configId = await registerConfig(-1);
    } catch (err) {
      expect(err).toBeDefined;
      expect(configId).not.toBeDefined;
    }

    // Register file provider successfully because it does not involve config
    assertAPIRequest({
      url: '/file/provider',
      apiKey: apiKey,
      data: {
        providerName: providerName,
        accessKey: {
          publicAccessKey: accessKeyId,
          privateAccessKey: secretAccessKey,
        },
        baseUrl: baseURL,
      },
      expectStatus: 201,
    });

    // Create bucket failed because config is undefined
    assertAPIRequest({
      url: '/file/bucket',
      apiKey: apiKey,
      data: {
        name: bucketName,
        configId: configId,
        fileProviderName: providerName,
        FileServiceFile: [],
      },
      expectStatus: 500,
    });

    // Upload file failed because config is undefine
    assertAPIRequest({
      url: '/file/upload',
      apiKey: apiKey,
      data: {
        fileName: fileName,
        bucketName: bucketName,
        providerName: providerName,
        configId: configId,
        region: region,
      },
      expectStatus: 500,
    });

    // Download file failed because config is undefine
    assertAPIRequest({
      url: '/file/download',
      apiKey: apiKey,
      data: {
        bucketName: bucketName,
        configId: configId,
        fileName: fileName,
        providerName: providerName,
      },
      expectStatus: 500,
    });
  });
});
