import { INestMicroservice } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { Test, TestingModule } from '@nestjs/testing';
import * as ProtoLoader from '@grpc/proto-loader';
import * as GRPC from '@grpc/grpc-js';

import { CounterProto, CounterProtoFile } from 'juno-proto';
import { AppModule } from 'src/app.module';

const { JUNO_COUNTER_PACKAGE_NAME } = CounterProto;

let app: INestMicroservice;

jest.setTimeout(10000);

async function initApp() {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: [JUNO_COUNTER_PACKAGE_NAME],
      protoPath: [CounterProtoFile],
      url: process.env.DB_SERVICE_ADDR,
    },
  });

  await app.init();
  await app.listen();

  return app;
}

beforeAll(async () => {
  app = await initApp();
  app.close();
});

beforeEach(async () => {
  app = await initApp();
});

afterEach(async () => {
  app.close();
});

describe('Counter Service Tests', () => {
  let counterClient: any;

  beforeEach(() => {
    const proto = ProtoLoader.loadSync([CounterProtoFile]) as any;
    const protoGRPC = GRPC.loadPackageDefinition(proto) as any;

    counterClient = new protoGRPC.juno.counter.CounterService(
      process.env.DB_SERVICE_ADDR,
      GRPC.credentials.createInsecure(),
    );
  });

  it('fails to get a nonexistent counter, so creates one', async () => {
    const counterId = 'test-counter';

    const promise = new Promise((resolve) => {
      counterClient.getCounter({ counterId }, (err, resp) => {
        expect(err).toBeNull();
        expect(resp).toHaveProperty('value');
        expect(resp.value).toBe(0);
        resolve(resp);
      });
    });

    await promise;
  });

  it('increments the counter correctly', async () => {
    const counterId = 'test-counter';

    const promise = new Promise((resolve) => {
      counterClient.incrementCounter({ counterId }, (err, resp) => {
        expect(err).toBeNull();
        expect(resp).toHaveProperty('value');
        expect(resp.value).toBe(1);
        resolve(resp);
      });
    });

    await promise;
  });

  it('decrements the counter correctly', async () => {
    const counterId = 'test-counter';

    const promise = new Promise((resolve) => {
      counterClient.decrementCounter({ counterId }, (err, resp) => {
        expect(err).toBeNull();
        expect(resp).toHaveProperty('value');
        expect(resp.value).toBe(0);
        resolve(resp);
      });
    });

    await promise;
  });

  it('resets the counter to zero', async () => {
    const counterId = 'test-counter';

    const promise = new Promise((resolve) => {
      counterClient.resetCounter({ counterId }, (err, resp) => {
        expect(err).toBeNull();
        expect(resp.value).toBe(0);
        resolve(resp);
      });
    });

    await promise;
  });

  it('retrieves the counter value', async () => {
    const counterId = 'test-counter';

    const promise = new Promise((resolve) => {
      counterClient.getCounter({ counterId }, (err, resp) => {
        expect(err).toBeNull();
        expect(resp).toHaveProperty('value');
        expect(resp.value).toBe(0);
        resolve(resp);
      });
    });

    await promise;
  });
});
