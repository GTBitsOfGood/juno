import {
  CreateBucketCommand,
  DeleteBucketCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { Test, TestingModule } from '@nestjs/testing';
import {
  ClassSerializerInterceptor,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { AppModule } from './../src/app.module';
import { Reflector } from '@nestjs/core';
import * as request from 'supertest';
import { ResetProtoFile, FileBucketProtoFile, FileProtoFile } from 'juno-proto';
import * as GRPC from '@grpc/grpc-js';
import * as ProtoLoader from '@grpc/proto-loader';
import { RpcExceptionFilter } from 'src/rpc_exception_filter';

jest.setTimeout(30000);

let app: INestApplication;
const ADMIN_EMAIL = 'test-superadmin@test.com';
const ADMIN_PASSWORD = 'test-password';
let apiKey: string | undefined = undefined;
let setupError: Error | null = null;

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

const bucketName = 'test-delete-bog-juno';
const configId = 0;
const providerName = 'test-provider';

const accessKeyId = process.env.accessKeyId;
const secretAccessKey = process.env.secretAccessKey;
const baseURL = process.env.baseURL;

const s3BucketName = `${bucketName}-${configId}-prod`;
let s3Client: S3Client;

beforeAll(async () => {
  try {
    const proto = ProtoLoader.loadSync([ResetProtoFile]) as any;
    const protoGRPC = GRPC.loadPackageDefinition(proto) as any;
    const resetClient = new protoGRPC.juno.reset_db.DatabaseReset(
      process.env.DB_SERVICE_ADDR,
      GRPC.credentials.createInsecure(),
    );
    await new Promise<void>((resolve, reject) => {
      resetClient.resetDb({}, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    const bucketProto = ProtoLoader.loadSync([FileBucketProtoFile]) as any;
    const bucketProtoGRPC = GRPC.loadPackageDefinition(bucketProto) as any;
    const bucketClient =
      new bucketProtoGRPC.juno.file_service.bucket.BucketDbService(
        process.env.DB_SERVICE_ADDR,
        GRPC.credentials.createInsecure(),
      );

    await new Promise<void>((resolve, reject) => {
      bucketClient.createBucket(
        {
          name: bucketName,
          configId,
          fileProviderName: providerName,
          files: [],
          configEnv: 'prod',
        },
        (err) => {
          if (err) reject(err);
          else resolve();
        },
      );
    });

    s3Client = new S3Client({
      endpoint: baseURL as string,
      region: 'us-east-005',
      credentials: {
        accessKeyId: accessKeyId as string,
        secretAccessKey: secretAccessKey as string,
      },
      forcePathStyle: true,
    });
    try {
      await s3Client.send(new CreateBucketCommand({ Bucket: s3BucketName }));
    } catch {
      // Bucket may already exist from a previous run
    }
  } catch (err) {
    setupError = err as Error;
  }
});

afterAll(async () => {
  if (app) await app.close();
  if (s3Client) {
    try {
      await s3Client.send(new DeleteBucketCommand({ Bucket: s3BucketName }));
    } catch {
      // Ignore cleanup errors
    }
  }
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
  app.useGlobalFilters(new RpcExceptionFilter());

  await app.init();

  if (!apiKey) {
    apiKey = await APIKeyForProjectName('test-seed-project');
  }
});

describe('File Delete Routes', () => {
  beforeEach(() => {
    if (setupError) {
      throw new Error(`Setup failed: ${setupError.message}`);
    }
  });

  it('Rejects delete without auth key', () => {
    return request(app.getHttpServer())
      .delete('/file/delete')
      .send({
        bucketName,
        configId,
        fileNames: ['SomeFile'],
      })
      .expect(401);
  });

  it('Rejects delete with missing bucketName', () => {
    return request(app.getHttpServer())
      .delete('/file/delete')
      .set('Authorization', 'Bearer ' + apiKey)
      .send({
        bucketName: '',
        configId,
        fileNames: ['SomeFile'],
      })
      .expect(400);
  });

  it('Rejects delete with negative configId', () => {
    return request(app.getHttpServer())
      .delete('/file/delete')
      .set('Authorization', 'Bearer ' + apiKey)
      .send({
        bucketName,
        configId: -1,
        fileNames: ['SomeFile'],
      })
      .expect(400);
  });

  it('Rejects delete with empty fileNames', () => {
    return request(app.getHttpServer())
      .delete('/file/delete')
      .set('Authorization', 'Bearer ' + apiKey)
      .send({
        bucketName,
        configId,
        fileNames: [],
      })
      .expect(400);
  });

  it('Successfully deletes a file', async () => {
    const fileProto = ProtoLoader.loadSync([FileProtoFile]) as any;
    const fileProtoGRPC = GRPC.loadPackageDefinition(fileProto) as any;
    const fileClient = new fileProtoGRPC.juno.file_service.file.FileDbService(
      process.env.DB_SERVICE_ADDR,
      GRPC.credentials.createInsecure(),
    );

    await new Promise<void>((resolve, reject) => {
      fileClient.createFile(
        {
          fileId: {
            bucketName,
            configId,
            configEnv: 'prod',
            path: 'FileToDeleteGW',
          },
          metadata: '',
        },
        (err) => {
          if (err) reject(err);
          else resolve();
        },
      );
    });

    const res = await request(app.getHttpServer())
      .delete('/file/delete')
      .set('Authorization', 'Bearer ' + apiKey)
      .send({
        bucketName,
        configId,
        fileNames: ['FileToDeleteGW'],
      });

    expect(res.status).toBe(200);
  });
});
