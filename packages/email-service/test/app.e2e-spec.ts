import { Test, TestingModule } from '@nestjs/testing';
import { INestMicroservice } from '@nestjs/common';
import { AppModule } from './../src/app.module';
import * as ProtoLoader from '@grpc/proto-loader';
import * as GRPC from '@grpc/grpc-js';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { EmailProtoFile, EmailProto } from 'juno-proto';

let app: INestMicroservice;
let emailClient: any;

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
      url: process.env.EMAIL_SERVICE_ADDR,
    },
  });

  await app.init();

  await app.listen();
  return app;
}

beforeAll(async () => {
  app = await initApp();

  const proto = ProtoLoader.loadSync([EmailProtoFile]) as any;

  const protoGRPC = GRPC.loadPackageDefinition(proto) as any;

  const resetClient = new protoGRPC.juno.reset_db.DatabaseReset(
    process.env.DB_SERVICE_ADDR,
    GRPC.credentials.createInsecure(),
  );

  const emailClient = new protoGRPC.juno.emailService(
    process.env.DB_SERVICE_ADDR,
    GRPC.credentials.createInsecure(),
  );

  await new Promise((resolve) => {
    resetClient.resetDb({}, () => {
      resolve(0);
    });
    emailClient.resetDb({}, () => {
      resolve(0);
    });
  });
});

afterAll(() => {
  app.close();
});

it('should successfully register a sender', async () => {
  const response: EmailProto.RegisterSenderResponse = await new Promise(
    (resolve, reject) => {
      emailClient.registerSender(
        {
          fromEmail: 'example@example.com',
          fromName: 'example',
          replyTo: 'example@example.com',
        },
        (err: any, response: EmailProto.RegisterSenderResponse) => {
          if (err) {
            reject(err);
          } else {
            resolve(response);
          }
        },
      );
    },
  );

  expect(response).toBeDefined();
  expect(response.statusCode).toEqual('201');
});

it('should fail to register a sender', async () => {
  const response: EmailProto.RegisterSenderResponse = await new Promise(
    (resolve, reject) => {
      emailClient.registerSender(
        {
          fromEmail: '',
          fromName: '',
          replyTo: '',
        },
        (err: any, response: EmailProto.RegisterSenderResponse) => {
          if (err) {
            reject(err);
          } else {
            resolve(response);
          }
        },
      );
    },
  );

  expect(response).toBeDefined();
  expect(response.statusCode).toEqual('201');
});
