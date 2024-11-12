import { Test, TestingModule } from '@nestjs/testing';
import { INestMicroservice } from '@nestjs/common';
import { AppModule } from './../src/app.module';
import * as ProtoLoader from '@grpc/proto-loader';
import * as GRPC from '@grpc/grpc-js';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import {
  FileBucketProto,
  FileBucketProtoFile,
  FileConfigProto,
  FileConfigProtoFile,
  FileProto,
  FileProtoFile,
  FileProviderProto,
  FileProviderProtoFile,
  HealthProto,
  HealthProtoFile,
  ResetProtoFile,
} from 'juno-proto';

let app: INestMicroservice;

jest.setTimeout(15000);

const TEST_SERVICE_ADDR = 'file-service:50001';

async function initApp() {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: [
        FileProviderProto.JUNO_FILE_SERVICE_PROVIDER_PACKAGE_NAME,
        FileConfigProto.JUNO_FILE_SERVICE_CONFIG_PACKAGE_NAME,
        FileBucketProto.JUNO_FILE_SERVICE_BUCKET_PACKAGE_NAME,
        FileProto.JUNO_FILE_SERVICE_FILE_PACKAGE_NAME,
        HealthProto.GRPC_HEALTH_V1_PACKAGE_NAME,
      ],
      protoPath: [
        FileProviderProtoFile,
        FileConfigProtoFile,
        FileBucketProtoFile,
        FileProtoFile,
        HealthProtoFile,
      ],
      url: TEST_SERVICE_ADDR,
    },
  });

  await app.init();

  await app.listen();
  return app;
}

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
});

afterAll(async () => {
  if (app) {
    await app.close();
  }
});

describe('File Service Tests', () => {
  let healthClient: any;
  // let fileClient: any;
  // let fileBucketClient: any;
  // let fileProviderClient: any;
  // let fileConfigClient: any;
  beforeEach(async () => {
    const proto = ProtoLoader.loadSync([
      FileProtoFile,
      FileBucketProtoFile,
      FileProviderProtoFile,
      FileConfigProtoFile,
      HealthProtoFile,
    ]) as any;

    // TODO once a controller is implemented, create the client for that service
    const protoGRPC = GRPC.loadPackageDefinition(proto) as any;
    healthClient = new protoGRPC.grpc.health.v1.Health(
      TEST_SERVICE_ADDR,
      GRPC.credentials.createInsecure(),
    );
  });

  it('health check', async () => {
    const response = await new Promise((resolve) => {
      healthClient.Check(
        {
          service: 'juno-file-service',
        },
        (err: any, resp: any) => {
          expect(err).toBeNull();
          resolve(resp);
        },
      );
    });
    expect(response).toBeDefined();
  });
});
