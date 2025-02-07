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

  it('creates and retrieves a counter with initial value 0', async () => {
    const data = (await new Promise((resolve) => {
      counterClient.createCounter({ value: 0 }, (err, resp) => {
        expect(err).toBeNull();
        expect(resp.value).toBe(0);
        resolve(resp);
      });
    })) as { counterId: string; value: number };

    await new Promise((resolve) => {
      counterClient.getCounter({ counterId: data.counterId }, (err, resp) => {
        expect(err).toBeNull();
        expect(resp.value).toBe(0);
        resolve(resp);
      });
    });
  });

  it('increments the counter correctly', async () => {
    const data = (await new Promise((resolve) => {
      counterClient.createCounter({ value: 0 }, (err, resp) => {
        expect(err).toBeNull();
        resolve(resp);
      });
    })) as { counterId: string; value: number };

    await new Promise((resolve) => {
      counterClient.incrementCounter(
        { counterId: data.counterId },
        (err, resp) => {
          expect(err).toBeNull();
          expect(resp.value).toBe(1);
          resolve(resp);
        },
      );
    });
  });

  it('decrements the counter correctly', async () => {
    const data = (await new Promise((resolve) => {
      counterClient.createCounter({ value: 0 }, (err, resp) => {
        expect(err).toBeNull();
        resolve(resp);
      });
    })) as { counterId: string; value: number };

    await new Promise((resolve) => {
      counterClient.incrementCounter({ counterId: data.counterId }, (err) => {
        expect(err).toBeNull();
        resolve(true);
      });
    });

    await new Promise((resolve) => {
      counterClient.decrementCounter(
        { counterId: data.counterId },
        (err, resp) => {
          expect(err).toBeNull();
          expect(resp.value).toBe(0);
          resolve(resp);
        },
      );
    });
  });

  it('handles multiple increments correctly and resets', async () => {
    const data = (await new Promise((resolve) => {
      counterClient.createCounter({ value: 0 }, (err, resp) => {
        expect(err).toBeNull();
        resolve(resp);
      });
    })) as { counterId: string; value: number };

    let lastValue = 1;
    for (let i = 0; i < 3; i++) {
      await new Promise((resolve) => {
        counterClient.incrementCounter(
          { counterId: data.counterId },
          (err, resp) => {
            expect(err).toBeNull();
            expect(resp.value).toBe(lastValue);
            resolve(resp);
          },
        );
      });
      lastValue++;
    }

    await new Promise((resolve) => {
      counterClient.resetCounter({ counterId: data.counterId }, (err, resp) => {
        expect(err).toBeNull();
        expect(resp.value).toBe(0);
        resolve(resp);
      });
    });
  });

  it('fails when incrementing a counter that does not exist', async () => {
    const invalidCounterId = `fake-counter-${Date.now()}`;

    await expect(
      new Promise((resolve, reject) => {
        counterClient.incrementCounter(
          { counterId: invalidCounterId },
          (err, resp) => {
            if (err) reject(err);
            else resolve(resp);
          },
        );
      }),
    ).rejects.toThrow();
  });

  it('retrieves updated value after incrementing', async () => {
    const data = (await new Promise((resolve) => {
      counterClient.createCounter({ value: 0 }, (err, resp) => {
        expect(err).toBeNull();
        resolve(resp);
      });
    })) as { counterId: string; value: number };

    await new Promise((resolve) => {
      counterClient.incrementCounter({ counterId: data.counterId }, (err) => {
        expect(err).toBeNull();
        resolve(true);
      });
    });

    await new Promise((resolve) => {
      counterClient.getCounter({ counterId: data.counterId }, (err, resp) => {
        expect(err).toBeNull();
        expect(resp.value).toBe(1);
        resolve(resp);
      });
    });
  });
});
