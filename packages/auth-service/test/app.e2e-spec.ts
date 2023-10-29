import { Test, TestingModule } from '@nestjs/testing';
import { INestMicroservice } from '@nestjs/common';
import { AppModule } from './../src/app.module';
import * as ProtoLoader from '@grpc/proto-loader';
import * as GRPC from '@grpc/grpc-js';
import { join } from 'path';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AUTHSERVICE_API_KEY_PACKAGE_NAME } from 'src/gen/api_key';
import { AUTHSERVICE_JWT_PACKAGE_NAME } from 'src/gen/jwt';

let app: INestMicroservice;
// TODO: make api key tests actually work once implemented
jest.setTimeout(7000);
beforeAll(async () => {
  const wait = new Promise((resolve) => {
    setTimeout(() => {
      resolve({});
    }, 6000);
  });
  await wait;
});

beforeEach(async () => {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  app = moduleFixture.createNestMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: [AUTHSERVICE_API_KEY_PACKAGE_NAME, AUTHSERVICE_JWT_PACKAGE_NAME],
      protoPath: [
        join(__dirname, '../../proto/auth-service/api_key.proto'),
        join(__dirname, '../../proto/auth-service/jwt.proto'),
      ],
      url: process.env.AUTH_SERVICE_ADDR,
    },
  });

  await app.init();

  await app.listen();
});

afterEach(async () => {
  app.close();
});

describe('Auth Service API Key Tests', () => {
  let client: any;

  beforeEach(async () => {
    const proto = ProtoLoader.loadSync(
      join(__dirname, '../../proto/auth-service/api_key.proto'),
    ) as any;

    const protoGRPC = GRPC.loadPackageDefinition(proto) as any;

    client = new protoGRPC.authservice.api_key.ApiKeyService(
      process.env.AUTH_SERVICE_ADDR,
      GRPC.credentials.createInsecure(),
    );
  });

  it('issues an API key', async () => {
    const promise = new Promise((resolve) => {
      client.issueApiKey({}, (err, resp) => {
        expect(err).toBeNull();
        expect(resp).toStrictEqual({});
        resolve({});
      });
    });

    await promise;
  });

  // it('revokes an API key', async () => {
  //   const promise = new Promise((resolve) => {
  //     client.revokeApiKey({}, (err, resp) => {
  //       expect(err).toBeNull();
  //       expect(resp).toStrictEqual({});
  //       resolve({});
  //     });
  //   });
  //
  //   await promise;
  // });
});

// describe('Auth Service JWT Tests', () => {
//   let client: any;
//
//   beforeEach(async () => {
//     const proto = ProtoLoader.loadSync(
//       join(__dirname, '../../proto/auth-service/jwt.proto'),
//     ) as any;
//
//     const protoGRPC = GRPC.loadPackageDefinition(proto) as any;
//
//     client = new protoGRPC.authservice.api_key.ApiKeyService(
//       process.env.AUTH_SERVICE_ADDR,
//       GRPC.credentials.createInsecure(),
//     );
//   });
//
//   it('creates a JWT', async () => {
//     const promise = new Promise((resolve) => {
//       client.createJWT({}, (err, resp) => {
//         expect(err).toBeNull();
//         expect(resp).toStrictEqual({});
//         resolve({});
//       });
//     });
//
//     await promise;
//   });
//
//   it('validates a JWT', async () => {
//     const promise = new Promise((resolve) => {
//       client.revokeApiKey({}, (err, resp) => {
//         expect(err).toBeNull();
//         expect(resp).toStrictEqual({});
//         resolve({});
//       });
//     });
//
//     await promise;
//   });
// });
