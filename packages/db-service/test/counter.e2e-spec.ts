import { Test, TestingModule } from '@nestjs/testing';
import { INestMicroservice } from '@nestjs/common';
import { AppModule } from './../src/app.module';
import * as ProtoLoader from '@grpc/proto-loader';
import * as GRPC from '@grpc/grpc-js';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import {
  IdentifiersProtoFile,
  ProjectProto,
  ProjectProtoFile,
  ResetProto,
  ResetProtoFile,
  CounterProto,
  CounterProtoFile,
} from 'juno-proto';

const { JUNO_COUNTER_PACKAGE_NAME } = CounterProto;
const { JUNO_PROJECT_PACKAGE_NAME } = ProjectProto;

let app: INestMicroservice;

jest.setTimeout(30000);

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
        ResetProto.JUNO_RESET_DB_PACKAGE_NAME,
      ],
      protoPath: [
        CounterProtoFile,
        ProjectProtoFile,
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
    )
  })

  it('creates a new counter', async () => {
    await new Promise((resolve) => {
      counterClient.createCounter(
        { 
          id: 'test1'
        },
        (err, resp) => {
          expect(err).toBeNull();
          expect(resp['value']).toBe(0);
          resolve({});
        },
      );    
    });
  });

  it('increments a counter', async () => {
    const counter = await new Promise((resolve) => {
      counterClient.createCounter(
        { 
          id: 'test2',
        },
        (err, resp) => {
          expect(err).toBeNull();
          resolve(resp);
        },
      );    
    }) as { id: string, value: number };

    await new Promise((resolve) => {
      counterClient.incrementCounter(
        {
          id: counter.id,
        },
        (err, resp) => {
          expect(err).toBeNull();
          expect(resp['value']).toBe(1);
          resolve({});
        },
      );
    });
  });

  it('decrements a counter', async () => {
    const counter = await new Promise((resolve) => {
      counterClient.createCounter(
        { 
          id: 'test3',
        },
        (err, resp) => {
          expect(err).toBeNull();
          resolve(resp);
        },
      );    
    }) as { id: string, value: number };

    await new Promise((resolve) => {
      counterClient.decrementCounter(
        {
          id: counter.id,
        },
        (err, resp) => {
          expect(err).toBeNull();
          expect(resp['value']).toBe(-1);
          resolve({});
        },
      );
    });
  });

  it('resets a counter', async () => {
    const counter = await new Promise((resolve) => {
      counterClient.createCounter(
        { 
          id: 'test4',
        },
        (err, resp) => {
          expect(err).toBeNull();
          resolve(resp);
        },
      );    
    }) as { id: string, value: number };

    await new Promise((resolve) => {
      counterClient.incrementCounter(
        {
          id: counter.id,
        },
        (err, resp) => {
          expect(err).toBeNull();
          resolve({});
        },
      );
    });

    await new Promise((resolve) => {
      counterClient.resetCounter(
        {
          id: counter.id,
        },
        (err, resp) => {
          expect(err).toBeNull();
          expect(resp['value']).toBe(0);
          resolve({});
        },
      );
    });
  });

  it('gets a counter', async () => {
    const originalCounter = await new Promise((resolve) => {
      counterClient.createCounter(
        { 
          id: 'test5',
        },
        (err, resp) => {
          expect(err).toBeNull();
          resolve(resp);
        },
      );    
    }) as { id: string, value: number };

    const retrievedCounter = await new Promise((resolve) => {
      counterClient.getCounter(
        {
          id: originalCounter.id,
        },
        (err, resp) => {
          expect(err).toBeNull();
          resolve(resp);
        },
      );
    });

    expect(retrievedCounter == originalCounter);
  });

});