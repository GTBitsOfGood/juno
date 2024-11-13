import { Test, TestingModule } from '@nestjs/testing';
import {
  ClassSerializerInterceptor,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { AppModule } from './../src/app.module';
import { Reflector } from '@nestjs/core';
import * as request from 'supertest';
import { FileProviderProto, ResetProtoFile } from 'juno-proto';
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

describe('File Provider Verification Routes', () => {
  it('Missing provider name file provider without auth key', () => {
    const fileProviderBody: FileProviderProto.RegisterProviderRequest = {
      providerName: '',
      publicAccessKey: 'Test Public Access Key',
      privateAccessKey: 'Test Private Access Key',
      baseUrl: 'https://aws.amazon.com/s3',
    };

    return request(app.getHttpServer())
      .post('/file/provider')
      .send(fileProviderBody)
      .expect(401);
  });

  it('Missing public access key file provider without auth key', () => {
    const fileProviderBody: FileProviderProto.RegisterProviderRequest = {
      providerName: 'Test Provider',
      publicAccessKey: '',
      privateAccessKey: 'Test Private Access Key',
      baseUrl: 'https://aws.amazon.com/s3',
    };

    return request(app.getHttpServer())
      .post('/file/provider')
      .send(fileProviderBody)
      .expect(401);
  });

  it('Missing private access key file provider without auth key', () => {
    const fileProviderBody: FileProviderProto.RegisterProviderRequest = {
      providerName: 'Test Provider',
      publicAccessKey: 'Test Public Access Key',
      privateAccessKey: '',
      baseUrl: 'https://aws.amazon.com/s3',
    };

    return request(app.getHttpServer())
      .post('/file/provider')
      .send(fileProviderBody)
      .expect(401);
  });

  it('Missing base url file provider without auth key', () => {
    const fileProviderBody: FileProviderProto.RegisterProviderRequest = {
      providerName: 'Test Provider',
      publicAccessKey: 'Test Public Access Key',
      privateAccessKey: 'Test Private Access Key',
      baseUrl: '',
    };

    return request(app.getHttpServer())
      .post('/file/provider')
      .send(fileProviderBody)
      .expect(401);
  });

  it('Valid file provider without auth key', () => {
    const fileProviderBody = {
      providerName: 'Test Provider',
      accessKey: {
        publicAccessKey: 'Test Public Access Key',
        privateAccessKey: 'Test Private Access Key',
      },
      baseUrl: 'https://aws.amazon.com/s3',
    };

    return request(app.getHttpServer())
      .post('/file/provider')
      .send(fileProviderBody)
      .expect(401);
  });

  it('Missing provider name file provider with auth key', () => {
    const fileProviderBody: FileProviderProto.RegisterProviderRequest = {
      providerName: '',
      publicAccessKey: 'Test Public Access Key',
      privateAccessKey: 'Test Private Access Key',
      baseUrl: 'https://aws.amazon.com/s3',
    };

    return request(app.getHttpServer())
      .post('/file/provider')
      .set('Authorization', 'Bearer ' + apiKey)
      .send(fileProviderBody)
      .expect(400);
  });

  it('Missing public access key file provider with auth key', () => {
    const fileProviderBody: FileProviderProto.RegisterProviderRequest = {
      providerName: 'Test Provider',
      publicAccessKey: '',
      privateAccessKey: 'Test Private Access Key',
      baseUrl: 'https://aws.amazon.com/s3',
    };

    return request(app.getHttpServer())
      .post('/file/provider')
      .set('Authorization', 'Bearer ' + apiKey)
      .send(fileProviderBody)
      .expect(400);
  });

  it('Missing private access key file provider with auth key', () => {
    const fileProviderBody: FileProviderProto.RegisterProviderRequest = {
      providerName: 'Test Provider',
      publicAccessKey: 'Test Public Access Key',
      privateAccessKey: '',
      baseUrl: 'https://aws.amazon.com/s3',
    };

    return request(app.getHttpServer())
      .post('/file/provider')
      .set('Authorization', 'Bearer ' + apiKey)
      .send(fileProviderBody)
      .expect(400);
  });

  it('Missing base url file provider with auth key', () => {
    const fileProviderBody: FileProviderProto.RegisterProviderRequest = {
      providerName: 'Test Provider',
      publicAccessKey: 'Test Public Access Key',
      privateAccessKey: 'Test Private Access Key',
      baseUrl: '',
    };

    return request(app.getHttpServer())
      .post('/file/provider')
      .set('Authorization', 'Bearer ' + apiKey)
      .send(fileProviderBody)
      .expect(400);
  });

  it('Valid file provider with auth key', async () => {
    const fileProviderBody = {
      providerName: 'Test Provider',
      accessKey: {
        publicAccessKey: 'Test Public Access Key',
        privateAccessKey: 'Test Private Access Key',
      },
      baseUrl: 'https://aws.amazon.com/s3',
    };

    return request(app.getHttpServer())
      .post('/file/provider')
      .set('Authorization', 'Bearer ' + apiKey)
      .send(fileProviderBody)
      .expect(201);
  });
});
