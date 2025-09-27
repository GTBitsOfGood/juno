import { Test, TestingModule } from '@nestjs/testing';
import { INestMicroservice } from '@nestjs/common';
import { AppModule } from './../src/app.module';
import * as ProtoLoader from '@grpc/proto-loader';
import * as GRPC from '@grpc/grpc-js';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AnalyticsProtoFile, ResetProtoFile } from 'juno-proto';
import { JUNO_EMAIL_PACKAGE_NAME } from 'juno-proto/dist/gen/email';

let app: INestMicroservice;

jest.setTimeout(15000);

async function initApp() {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: [JUNO_EMAIL_PACKAGE_NAME],
      protoPath: [AnalyticsProtoFile],
      url: process.env.EMAIL_SERVICE_ADDR,
    },
  });

  await app.init();

  await app.listen();
  return app;
}

beforeAll(async () => {
  app = await initApp();

  const proto = ProtoLoader.loadSync([
    AnalyticsProtoFile,
    ResetProtoFile,
  ]) as any;

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

describe('Analytics Service Sender Registration Tests', () => {
  //   let analyticsClient: any;
  //   beforeEach(async () => {
  //     const proto = ProtoLoader.loadSync([AnalyticsProtoFile]) as any;
  //     const protoGRPC = GRPC.loadPackageDefinition(proto) as any;
  //     analyticsClient = new protoGRPC.juno.analytics.AnalyticsService(
  //       process.env.ANALYTICS_SERVICE_ADDR,
  //       GRPC.credentials.createInsecure(),
  //     );
  //   });
});
