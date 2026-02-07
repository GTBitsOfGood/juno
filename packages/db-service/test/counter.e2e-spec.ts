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
    counterClient = new protoGRPC.juno.counter.CounterDbService(
      process.env.DB_SERVICE_ADDR,
      GRPC.credentials.createInsecure(),
    );
  });

  it('increments a counter that does not exist', async () => {
    const response: CounterProto.Counter = await new Promise(
      (resolve, reject) => {
        counterClient.incrementCounter({ id: 'test-counter-1' }, (err, res) => {
          if (err) {
            reject(err);
          } else {
            resolve(res);
          }
        });
      },
    );

    expect(response).toHaveProperty('id', 'test-counter-1');
    expect(response.value).toBe(1);
  });

  it('increments an existing counter', async () => {
    // First increment
    await new Promise<void>((resolve, reject) => {
      counterClient.incrementCounter({ id: 'test-counter-2' }, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Second increment
    const response: CounterProto.Counter = await new Promise(
      (resolve, reject) => {
        counterClient.incrementCounter({ id: 'test-counter-2' }, (err, res) => {
          if (err) {
            reject(err);
          } else {
            resolve(res);
          }
        });
      },
    );

    expect(response).toHaveProperty('id', 'test-counter-2');
    expect(response.value).toBe(2);
  });

  it('decrements a counter that does not exist', async () => {
    const response: CounterProto.Counter = await new Promise(
      (resolve, reject) => {
        counterClient.decrementCounter({ id: 'test-counter-3' }, (err, res) => {
          if (err) {
            reject(err);
          } else {
            resolve(res);
          }
        });
      },
    );

    expect(response).toHaveProperty('id', 'test-counter-3');
    expect(response.value).toBe(-1);
  });

  it('decrements an existing counter', async () => {
    // First increment to create counter
    await new Promise<void>((resolve, reject) => {
      counterClient.incrementCounter({ id: 'test-counter-4' }, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Decrement
    const response: CounterProto.Counter = await new Promise(
      (resolve, reject) => {
        counterClient.decrementCounter({ id: 'test-counter-4' }, (err, res) => {
          if (err) {
            reject(err);
          } else {
            resolve(res);
          }
        });
      },
    );

    expect(response).toHaveProperty('id', 'test-counter-4');
    expect(response.value).toBe(0);
  });

  it('resets a counter to 0', async () => {
    // First increment to create counter
    await new Promise<void>((resolve, reject) => {
      counterClient.incrementCounter({ id: 'test-counter-5' }, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Increment again
    await new Promise<void>((resolve, reject) => {
      counterClient.incrementCounter({ id: 'test-counter-5' }, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Reset
    const response: CounterProto.Counter = await new Promise(
      (resolve, reject) => {
        counterClient.resetCounter({ id: 'test-counter-5' }, (err, res) => {
          if (err) {
            reject(err);
          } else {
            resolve(res);
          }
        });
      },
    );

    expect(response).toHaveProperty('id', 'test-counter-5');
    expect(response.value).toBe(0);
  });

  it('fails to reset a non-existent counter', async () => {
    await new Promise((resolve) => {
      counterClient.resetCounter({ id: 'non-existent-counter' }, (err) => {
        expect(err.code).toBe(GRPC.status.NOT_FOUND);
        expect(err.details).toBe('Counter not found');
        resolve({});
      });
    });
  });

  it('gets a counter', async () => {
    // First increment to create counter
    await new Promise<void>((resolve, reject) => {
      counterClient.incrementCounter({ id: 'test-counter-6' }, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Get counter
    const response: CounterProto.Counter = await new Promise(
      (resolve, reject) => {
        counterClient.getCounter({ id: 'test-counter-6' }, (err, res) => {
          if (err) {
            reject(err);
          } else {
            resolve(res);
          }
        });
      },
    );

    expect(response).toHaveProperty('id', 'test-counter-6');
    expect(response.value).toBe(1);
  });

  it('fails to get a non-existent counter', async () => {
    await new Promise((resolve) => {
      counterClient.getCounter({ id: 'non-existent-counter-2' }, (err) => {
        expect(err.code).toBe(GRPC.status.NOT_FOUND);
        expect(err.details).toBe('Counter not found');
        resolve({});
      });
    });
  });
});
