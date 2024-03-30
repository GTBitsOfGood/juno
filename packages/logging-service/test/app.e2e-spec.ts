import { Test, TestingModule } from '@nestjs/testing';
import { INestMicroservice } from '@nestjs/common';
import { AppModule } from './../src/app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import * as ProtoLoader from '@grpc/proto-loader';
import * as GRPC from '@grpc/grpc-js';
import { LoggingProtoFile } from 'juno-proto';
import { JUNO_LOGGING_PACKAGE_NAME } from 'juno-proto/dist/gen/logging';

let app: INestMicroservice;

jest.setTimeout(15000);

async function initApp() {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: JUNO_LOGGING_PACKAGE_NAME,
      protoPath: [LoggingProtoFile],
      url: process.env.LOGGING_SERVICE_ADDR,
    },
  });

  await app.init();

  await app.listen();
  return app;
}

beforeAll(async () => {
  app = await initApp();
});

afterAll(() => {
  app.close();
});

describe('AppService', () => {
  let loggingClient: any;
  beforeEach(async () => {
    const proto = ProtoLoader.loadSync([LoggingProtoFile]) as any;

    const protoGRPC = GRPC.loadPackageDefinition(proto) as any;

    loggingClient = new protoGRPC.juno.logging.LoggingService(
      process.env.LOGGING_SERVICE_ADDR,
      GRPC.credentials.createInsecure(),
    );
  });

  it('should log error messages', async () => {
    const testMessage = 'Test error';
    await new Promise((resolve) => {
      loggingClient.recordError(
        {
          msg: testMessage,
        },
        (err, resp) => {
          expect(err).toBeNull();
          resolve(resp);
        },
      );
    });
  });

  it('should log info messages', async () => {
    const testMessage = 'Test info';
    await new Promise((resolve) => {
      loggingClient.recordInfo(
        {
          msg: testMessage,
        },
        (err, resp) => {
          expect(err).toBeNull();
          resolve(resp);
        },
      );
    });
  });
});
