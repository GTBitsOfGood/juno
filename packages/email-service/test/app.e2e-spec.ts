import { Test, TestingModule } from '@nestjs/testing';
import { INestMicroservice } from '@nestjs/common';
import { AppModule } from './../src/app.module';
import * as ProtoLoader from '@grpc/proto-loader';
import * as GRPC from '@grpc/grpc-js';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { EmailProtoFile, EmailProto, ResetProtoFile } from 'juno-proto';
import { JUNO_EMAIL_PACKAGE_NAME } from 'juno-proto/dist/gen/email';

let app: INestMicroservice;

jest.setTimeout(15000);

async function initApp() {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: [JUNO_EMAIL_PACKAGE_NAME],
      protoPath: [EmailProtoFile],
      url: process.env.EMAIL_SERVICE_ADDR,
    },
  });

  await app.init();

  await app.listen();
  return app;
}

beforeAll(async () => {
  app = await initApp();

  const proto = ProtoLoader.loadSync([EmailProtoFile, ResetProtoFile]) as any;

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
});

afterAll(() => {
  app.close();
});

describe('Email Service Sender Registration Tests', () => {
  let emailClient: any;
  beforeEach(async () => {
    const proto = ProtoLoader.loadSync([EmailProtoFile]) as any;

    const protoGRPC = GRPC.loadPackageDefinition(proto) as any;

    emailClient = new protoGRPC.juno.email.EmailService(
      process.env.EMAIL_SERVICE_ADDR,
      GRPC.credentials.createInsecure(),
    );
  });

  it('should successfully register a sender', async () => {
    const response: EmailProto.RegisterSenderResponse = await new Promise(
      (resolve, reject) => {
        emailClient.registerSender(
          {
            fromEmail: 'example@example.com',
            fromName: 'example',
            replyTo: 'example@example.com',
            configId: 0,
            configEnvironment: 'prod',
            address: 'address',
            city: 'city',
            state: 'state',
            country: 'country',
            zip: 'zip',
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
    expect(response.statusCode).toEqual(201);
  });

  it('should fail to register a sender', async () => {
    const response: any = await new Promise((resolve, reject) => {
      emailClient.registerSender(
        {
          fromEmail: '',
          fromName: '',
          replyTo: '',
          configId: 0,
          configEnvironment: 'prod',
          address: 'address',
          city: 'city',
          state: 'state',
          country: 'country',
          zip: 'zip',
        },
        (err: any, response: EmailProto.RegisterSenderResponse) => {
          if (err) {
            resolve(err);
          } else {
            reject(response);
          }
        },
      );
    });

    expect(response).toBeDefined();
  });
});
