import { Test, TestingModule } from '@nestjs/testing';

import { INestMicroservice } from '@nestjs/common';
import { AppModule } from 'src/app.module';
import * as ProtoLoader from '@grpc/proto-loader';
import * as GRPC from '@grpc/grpc-js';

import { MicroserviceOptions, Transport } from '@nestjs/microservices';

import {
  CounterProto,
  CounterProtoFile,
  ProjectProto,
  ProjectProtoFile,
  ResetProtoFile,
  IdentifiersProtoFile,
  ResetProto,
} from 'juno-proto';
import { isReadable } from 'stream';

const { JUNO_COUNTER_PACKAGE_NAME } = CounterProto;
const { JUNO_PROJECT_PACKAGE_NAME } = ProjectProto;
const { JUNO_RESET_DB_PACKAGE_NAME } = ResetProto;
let app: INestMicroservice;

jest.setTimeout(15000);

async function initApp() {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: [
        JUNO_COUNTER_PACKAGE_NAME,
        JUNO_PROJECT_PACKAGE_NAME,
        JUNO_RESET_DB_PACKAGE_NAME,
      ],
      protoPath: [
        CounterProtoFile,
        ResetProtoFile,
        ProjectProtoFile,
        IdentifiersProtoFile,
      ],
      url: process.env.DB_SERVICE_ADDR,
    },
  });
  await app.init();
  await app.listen();
  return app;
}

beforeAll(async () => {
  const app = await initApp();

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

  app.close();
});

beforeEach(async () => {
  app = await initApp();
});

afterEach(async () => {
  app.close();
});

describe('DB Service Counter Tests', () => {
  let counterClient: any;

  beforeEach(() => {
    const counterProto = ProtoLoader.loadSync([
      CounterProtoFile,
      IdentifiersProtoFile,
    ]) as any;

    const counterProtoGRPC = GRPC.loadPackageDefinition(counterProto) as any;

    counterClient = new counterProtoGRPC.juno.counter.CounterService(
      process.env.DB_SERVICE_ADDR,
      GRPC.credentials.createInsecure(),
    );
  });
  it('create a new counter', async () => {
    const promise = new Promise((resolve) => {
      counterClient.createCounter('test_counter', (err, resp) => {
        expect(err).toBeNull();
        expect(resp['value']).toBe(0);
        resolve({});
      });
    });
    await promise;
  });

  it('increment counter', async () => {
    const promise = new Promise((resolve) => {
      counterClient.incrementCounter('test_counter', (err, resp) => {
        expect(err).toBeNull();
        expect(resp['value']).toBe(1);
      });
    });
    await promise;
  });

  it('increment counter 2 ', async () => {
    const promise = new Promise((resolve) => {
      counterClient.incrementCounter('test_counter', (err, resp) => {
        expect(err).toBeNull();
        expect(resp['value']).toBe(2);
      });
    });
    await promise;
  });

  it('decrement counter', async () => {
    const promise = new Promise((resolve) => {
      counterClient.decrementCounter('test_counter', (err, resp) => {
        expect(err).toBeNull();
        expect(resp['value']).toBe(1);
      });
    });
    await promise;
  });

  it('reset counter', async () => {
    const promise = new Promise((resolve) => {
      counterClient.resetCounter('test_counter', (err, resp) => {
        expect(err).toBeNull();
        expect(resp['value']).toBe(0);
      });
    });
    await promise;
  });
});
