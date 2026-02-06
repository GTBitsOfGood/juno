import { Test, TestingModule } from '@nestjs/testing';
import { INestMicroservice } from '@nestjs/common';
import { AppModule } from './../src/app.module';
import * as ProtoLoader from '@grpc/proto-loader';
import * as GRPC from '@grpc/grpc-js';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import {
  IdentifiersProtoFile,
  ResetProto,
  ResetProtoFile,
  CounterProto,
  CounterProtoFile,
  CommonProtoFile,
} from 'juno-proto';
import { CounterService } from 'src/modules/counter/counter.service';

const { JUNO_COUNTER_PACKAGE_NAME } = CounterProto;

let app: INestMicroservice;

jest.setTimeout(15000);

async function initApp() {
  // moduleFixture is provided in each test's parameters to get access to the
  // running microservice
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: [
        JUNO_COUNTER_PACKAGE_NAME,
        ResetProto.JUNO_RESET_DB_PACKAGE_NAME,
      ],
      protoPath: [
        CounterProtoFile,
        CommonProtoFile,
        IdentifiersProtoFile,
        ResetProtoFile,
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
  let counterClient: CounterService;
  beforeEach(() => {
    const proto = ProtoLoader.loadSync([
      CounterProtoFile,
      CommonProtoFile,
      IdentifiersProtoFile,
    ]) as any;

    const protoGRPC = GRPC.loadPackageDefinition(proto) as any;

    counterClient = new protoGRPC.juno.counter.CounterService(
      process.env.DB_SERVICE_ADDR,
      GRPC.credentials.createInsecure(),
    );
  });

  // Logic for cleaning up created project ids.
  let modifiedCounterIds: string[] = [];
  afterEach(async () => {
    await Promise.all(
      modifiedCounterIds.map(
        (id) =>
          new Promise((resolve, reject) => {
            try {
              counterClient.resetCounter({ id: id });
              resolve(id);
            } catch (e) {
              // TODO: narrow the type of error
              reject(e);
            }
          }),
      ),
    );
    modifiedCounterIds = [];
  });

  it('increments a counter and gets its updated value', async () => {
    // note: did not catch potential exceptions in test body since
    // jest will treat exceptions as a test failure.
    const initCounter = await counterClient.getCounter({ id: 'orange' });
    expect(initCounter).toEqual({ id: 'orange', value: 0 });
    const counter = await counterClient.incrementCounter({ id: 'orange' });
    expect(counter).toEqual({ id: 'orange', value: 1 });
  });

  it('increments a counter multiple times, followed by a decrement', async () => {
    // note: did not catch potential exceptions in test body since
    // jest will treat exceptions as a test failure.
    const initCounter = await counterClient.getCounter({ id: 'orange' });
    expect(initCounter).toEqual({ id: 'orange', value: 0 });
    await counterClient.incrementCounter({ id: 'orange' });
    await counterClient.incrementCounter({ id: 'orange' });
    const counter = await counterClient.incrementCounter({ id: 'orange' });
    expect(counter).toEqual({ id: 'orange', value: 3 });
    const decrementedCounter = await counterClient.decrementCounter({
      id: 'orange',
    });
    expect(decrementedCounter).toEqual({ id: 'orange', value: 2 });
  });
});
