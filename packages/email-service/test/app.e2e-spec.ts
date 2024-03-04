import { Test, TestingModule } from '@nestjs/testing';
import { INestMicroservice } from '@nestjs/common';
import { AppModule } from './../src/app.module';
import * as ProtoLoader from '@grpc/proto-loader';
import * as GRPC from '@grpc/grpc-js';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { EmailProtoFile, EmailProto } from 'juno-proto';

let app: INestMicroservice;
let sendGridClient: any;

jest.setTimeout(15000);

async function initApp() {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: 'juno',
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

  const proto = ProtoLoader.loadSync([EmailProtoFile]) as any;
  const protoGRPC = GRPC.loadPackageDefinition(proto) as any;
  sendGridClient = new protoGRPC.juno.email.SendGridEmailService(
    process.env.DB_SERVICE_ADDR,
    GRPC.credentials.createInsecure(),
  );
});

afterAll(() => {
  app.close();
});

it('should successfully register a domain', async () => {
  const response: EmailProto.AuthenticateDomainResponse = await new Promise(
    (resolve, reject) => {
      sendGridClient.authenticateDomain(
        {
          domain: 'example.com',
          subdomain: 'mail',
        },
        (err: any, response: EmailProto.AuthenticateDomainResponse) => {
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
  expect(response.id).toBeDefined();
  expect(response.valid).toEqual('true');
});

it('should fail to register a domain', async () => {
  const response: EmailProto.AuthenticateDomainResponse = await new Promise(
    (resolve, reject) => {
      sendGridClient.authenticateDomain(
        {
          domain: '',
          subdomain: '',
        },
        (err: any, response: EmailProto.AuthenticateDomainResponse) => {
          if (err) {
            reject(err);
          } else {
            resolve(response);
          }
        },
      );
    },
  );
  expect(response.statusCode).not.toEqual('201');
});
