import { Test, TestingModule } from '@nestjs/testing';
import { INestMicroservice } from '@nestjs/common';
import { AppModule } from './../src/app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import * as ProtoLoader from '@grpc/proto-loader';
import * as GRPC from '@grpc/grpc-js';
import { LoggingProtoFile } from 'juno-proto';

let app: INestMicroservice;

jest.setTimeout(15000);

async function initApp() {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: [],
      protoPath: [],
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

    loggingClient = new protoGRPC.juno.email.EmailService(
      process.env.EMAIL_SERVICE_ADDR,
      GRPC.credentials.createInsecure(),
    );
  });

  it('should log error messages', () => {
    const testMessage = 'Test error';
    expect(loggingClient.recordError(testMessage)).toBeUndefined();
  });
});
