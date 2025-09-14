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

const { JUNO_COUNTER_PACKAGE_NAME } = CounterProto;
const { JUNO_PROJECT_PACKAGE_NAME } = ProjectProto;
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

  it('increments a counter', async () => {
    const response: any = await new Promise((resolve, reject) => {
      counterClient.incrementCounter(
        {
          counterId: 'testCounter-1',
          amount: 5,
        },
        (err, res) => {
          if (err) {
            reject(err);
          } else {
            resolve(res);
          }
        },
      );
    });
    expect(response).toHaveProperty('counterId', 'testCounter-1');
    expect(response).toHaveProperty('value', 5);
  });

  it('decrements a counter', async () => {
    // First increment to 10
    await new Promise((resolve, reject) => {
      counterClient.incrementCounter(
        {
          counterId: 'testCounter-2',
          amount: 10,
        },
        (err, res) => {
          if (err) reject(err);
          else resolve(res);
        },
      );
    });
    // Then decrement by 3
    const response: any = await new Promise((resolve, reject) => {
      counterClient.decrementCounter(
        {
          counterId: 'testCounter-2',
          amount: 3,
        },
        (err, res) => {
          if (err) reject(err);
          else resolve(res);
        },
      );
    });
    expect(response).toHaveProperty('counterId', 'testCounter-2');
    expect(response).toHaveProperty('value', 7);
  });

  it('gets a counter', async () => {
    // Set value
    await new Promise((resolve, reject) => {
      counterClient.incrementCounter(
        {
          counterId: 'testCounter-3',
          amount: 42,
        },
        (err, res) => {
          if (err) reject(err);
          else resolve(res);
        },
      );
    });
    // Get value
    const response: any = await new Promise((resolve, reject) => {
      counterClient.getCounter(
        {
          counterId: 'testCounter-3',
        },
        (err, res) => {
          if (err) reject(err);
          else resolve(res);
        },
      );
    });
    expect(response).toHaveProperty('counterId', 'testCounter-3');
    expect(response).toHaveProperty('value', 42);
  });

  it('resets a counter', async () => {
    // Set value
    await new Promise((resolve, reject) => {
      counterClient.incrementCounter(
        {
          counterId: 'testCounter-4',
          amount: 100,
        },
        (err, res) => {
          if (err) reject(err);
          else resolve(res);
        },
      );
    });
    // Reset
    const response: any = await new Promise((resolve, reject) => {
      counterClient.resetCounter(
        {
          counterId: 'testCounter-4',
        },
        (err, res) => {
          if (err) reject(err);
          else resolve(res);
        },
      );
    });
    expect(response).toHaveProperty('counterId', 'testCounter-4');
    expect(response).toHaveProperty('value', 0);
  });

  it('returns 0 for non-existent counter', async () => {
    const response: any = await new Promise((resolve, reject) => {
      counterClient.getCounter(
        {
          counterId: 'nonexistent',
        },
        (err, res) => {
          if (err) reject(err);
          else resolve(res);
        },
      );
    });
    expect(response).toHaveProperty('counterId', 'nonexistent');
    expect(response).toHaveProperty('value', 0);
  });
});
