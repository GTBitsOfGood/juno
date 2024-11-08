import { Test, TestingModule } from '@nestjs/testing';
import { INestMicroservice } from '@nestjs/common';
import { AppModule } from './../src/app.module';
import * as ProtoLoader from '@grpc/proto-loader';
import * as GRPC from '@grpc/grpc-js';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import {
  FileProtoFile,
  FileProviderProto,
  FileProviderProtoFile,
  ResetProtoFile,
} from 'juno-proto';

let app: INestMicroservice;

jest.setTimeout(15000);

async function initApp() {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: [FileProviderProto.JUNO_FILE_SERVICE_PROVIDER_PACKAGE_NAME],
      protoPath: [FileProviderProtoFile, FileProtoFile],
      url: process.env.FILE_SERVICE_ADDR,
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

afterAll(() => {
  app.close();
});

describe('File Provider Tests', () => {
  let fileProviderClient: any;

  beforeEach(async () => {
    const proto = ProtoLoader.loadSync([FileProviderProtoFile]) as any;

    // TODO once a controller is implemented, create the client for that service
    const protoGRPC = GRPC.loadPackageDefinition(proto) as any;
    healthClient = new protoGRPC.grpc.health.v1.Health(
      process.env.DB_SERVICE_ADDR,
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
