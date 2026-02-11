import { INestMicroservice } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { Test, TestingModule } from '@nestjs/testing';
import * as ProtoLoader from '@grpc/proto-loader';
import * as GRPC from '@grpc/grpc-js';

import {
  CounterProto,
  CounterProtoFile,
  ResetProto,
  ResetProtoFile,
} from 'juno-proto';
import { AppModule } from '../src/app.module';

const { JUNO_DB_SERVICE_COUNTER_PACKAGE_NAME } = CounterProto;
const { JUNO_RESET_DB_PACKAGE_NAME } = ResetProto;

let app: INestMicroservice;

jest.setTimeout(10000);

async function initApp() {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: [
        JUNO_DB_SERVICE_COUNTER_PACKAGE_NAME,
        JUNO_RESET_DB_PACKAGE_NAME,
      ],
      protoPath: [CounterProtoFile, ResetProtoFile],
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

  await app.close();
});

beforeEach(async () => {
  app = await initApp();
});

afterEach(async () => {
  await app.close();
});

describe('DB Service Counter Tests', () => {
  let counterClient: any;

  beforeEach(() => {
    const counterProto = ProtoLoader.loadSync([CounterProtoFile]) as any;

    const counterProtoGRPC = GRPC.loadPackageDefinition(counterProto) as any;

    counterClient = new counterProtoGRPC.juno.db_service.counter.CounterService(
      process.env.DB_SERVICE_ADDR,
      GRPC.credentials.createInsecure(),
    );
  });

  it('gets the counter', async () => {
    const promise = new Promise((resolve) => {
      counterClient.getCounter(
        {
          id: 'test-counter',
        },
        (err, resp) => {
          expect(err).toBeNull();
          expect(resp['value']).toBe(0);
          resolve({});
        },
      );
    });

    await promise;
  });

  it('increments the counter', async () => {
    const promise = new Promise((resolve) => {
      counterClient.incrementCounter(
        {
          id: 'test-counter',
          value: 10,
        },
        (err, resp) => {
          expect(err).toBeNull();
          expect(resp['value']).toBe(10);
          resolve({});
        },
      );
    });

    await promise;
  });

  it('decrements the counter', async () => {
    const promise = new Promise((resolve) => {
      counterClient.decrementCounter(
        {
          id: 'test-counter',
          value: 3,
        },
        (err, resp) => {
          expect(err).toBeNull();
          expect(resp['value']).toBe(7);
          resolve({});
        },
      );
    });

    await promise;
  });

  it('resets the counter', async () => {
    const promise = new Promise((resolve) => {
      counterClient.resetCounter(
        {
          id: 'test-counter',
        },
        (err, resp) => {
          expect(err).toBeNull();
          expect(resp['value']).toBe(0);
          resolve({});
        },
      );
    });

    await promise;
  });
});
