import * as GRPC from '@grpc/grpc-js';
import * as ProtoLoader from '@grpc/proto-loader';
import { INestMicroservice } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { Test, TestingModule } from '@nestjs/testing';
import {
  CounterProto,
  CounterProtoFile,
  ResetProto,
  ResetProtoFile,
} from 'juno-proto';
import { AppModule } from '../src/app.module';

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
        CounterProto.JUNO_COUNTER_PACKAGE_NAME,
        ResetProto.JUNO_RESET_DB_PACKAGE_NAME,
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

  app.close();
});

beforeEach(async () => {
  app = await initApp();
});

afterEach(async () => {
  await app.close();
});

describe('Counter Tests', () => {
  let counterClient: any;

  beforeEach(() => {
    const proto = ProtoLoader.loadSync([CounterProtoFile]) as any;
    const protoGRPC = GRPC.loadPackageDefinition(proto) as any;
    counterClient = new protoGRPC.juno.counter.CounterService(
      process.env.DB_SERVICE_ADDR,
      GRPC.credentials.createInsecure(),
    );
  });

  it('creates a counter with initial value', async () => {
    const response = await new Promise((resolve, reject) => {
      counterClient.createCounter(
        { id: 'e2e-create-counter', initial_value: 5 },
        (err, res) => {
          if (err) reject(err);
          else resolve(res);
        },
      );
    });
    expect(response).toHaveProperty('value', 5);
  });

  it('cannot create a duplicate counter', async () => {
    await new Promise((resolve) => {
      counterClient.createCounter(
        { id: 'e2e-create-duplicate', initial_value: 0 },
        () => {
          resolve(0);
        },
      );
    });

    await new Promise((resolve) => {
      counterClient.createCounter(
        { id: 'e2e-create-duplicate', initial_value: 1 },
        (err) => {
          expect(err.code).toBe(GRPC.status.ALREADY_EXISTS);
          expect(err.details).toBe('Counter already exists');
          resolve(0);
        },
      );
    });
  });

  it('gets a counter value', async () => {
    await new Promise((resolve) => {
      counterClient.createCounter(
        { id: 'e2e-get-counter', initial_value: 10 },
        () => {
          resolve(0);
        },
      );
    });

    const response = await new Promise((resolve, reject) => {
      counterClient.getCounter({ id: 'e2e-get-counter' }, (err, res) => {
        if (err) reject(err);
        else resolve(res);
      });
    });
    expect(response).toHaveProperty('value', 10);
  });

  it('returns NOT_FOUND for nonexistent counter', async () => {
    await new Promise((resolve) => {
      counterClient.getCounter({ id: 'nonexistent-id' }, (err) => {
        expect(err.code).toBe(GRPC.status.NOT_FOUND);
        expect(err.details).toBe('Counter not found');
        resolve(0);
      });
    });
  });

  it('increments a counter', async () => {
    await new Promise((resolve) => {
      counterClient.createCounter(
        { id: 'e2e-increment', initial_value: 0 },
        () => {
          resolve(0);
        },
      );
    });

    const first = await new Promise((resolve, reject) => {
      counterClient.incrementCounter({ id: 'e2e-increment' }, (err, res) => {
        if (err) reject(err);
        else resolve(res);
      });
    });
    expect(first).toHaveProperty('value', 1);

    const second = await new Promise((resolve, reject) => {
      counterClient.incrementCounter({ id: 'e2e-increment' }, (err, res) => {
        if (err) reject(err);
        else resolve(res);
      });
    });
    expect(second).toHaveProperty('value', 2);
  });

  it('decrements a counter', async () => {
    await new Promise((resolve) => {
      counterClient.createCounter(
        { id: 'e2e-decrement', initial_value: 0 },
        () => {
          resolve(0);
        },
      );
    });

    const first = await new Promise((resolve, reject) => {
      counterClient.decrementCounter({ id: 'e2e-decrement' }, (err, res) => {
        if (err) reject(err);
        else resolve(res);
      });
    });
    expect(first).toHaveProperty('value', -1);

    const second = await new Promise((resolve, reject) => {
      counterClient.decrementCounter({ id: 'e2e-decrement' }, (err, res) => {
        if (err) reject(err);
        else resolve(res);
      });
    });
    expect(second).toHaveProperty('value', -2);
  });

  it('resets a counter to zero', async () => {
    await new Promise((resolve) => {
      counterClient.createCounter({ id: 'e2e-reset', initial_value: 5 }, () => {
        resolve(0);
      });
    });

    const response = await new Promise((resolve, reject) => {
      counterClient.resetCounter({ id: 'e2e-reset' }, (err, res) => {
        if (err) reject(err);
        else resolve(res);
      });
    });
    expect(response).toHaveProperty('value', 0);
  });
});
