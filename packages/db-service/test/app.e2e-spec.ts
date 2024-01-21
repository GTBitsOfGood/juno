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
  UserProto,
  UserProtoFile,
} from 'juno-proto';

// TODO: Make these actual tests

const { DBSERVICE_USER_PACKAGE_NAME } = UserProto;
const { DBSERVICE_PROJECT_PACKAGE_NAME } = ProjectProto;

let app: INestMicroservice;

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
      package: [DBSERVICE_USER_PACKAGE_NAME, DBSERVICE_PROJECT_PACKAGE_NAME],
      protoPath: [UserProtoFile, ProjectProtoFile, IdentifiersProtoFile],
      url: process.env.DB_SERVICE_ADDR,
    },
  });

  await app.init();

  await app.listen();
});

afterEach(async () => {
  app.close();
});

describe('DB Service User Tests', () => {
  let client: any;
  beforeEach(() => {
    const proto = ProtoLoader.loadSync([
      UserProtoFile,
      IdentifiersProtoFile,
    ]) as any;

    const protoGRPC = GRPC.loadPackageDefinition(proto) as any;

    client = new protoGRPC.dbservice.user.UserService(
      process.env.DB_SERVICE_ADDR,
      GRPC.credentials.createInsecure(),
    );
  });

  it('creates a new user', async () => {
    const promise = new Promise((resolve) => {
      client.createUser(
        {
          email: 'test@test.com',
          password: 'some-password',
          name: 'some-name',
          type: 'SUPERADMIN',
        },
        (err, resp) => {
          expect(err).toBeNull();
          expect(`${resp['id']}`).toBe('1');
          expect(resp['email']).toBe('test@test.com');
          expect(resp['name']).toBe('some-name');
          expect(resp['type']).toBe(0);
          resolve({});
        },
      );
    });

    await promise;
  });
  //
  // it('updates a user', async () => {
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
  //
  // it('gets a user', async () => {
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
  //
  // it('deletes a user', async () => {
  //   const promise = new Promise((resolve) => {
  //     client.issueApiKey({}, (err, resp) => {
  //       expect(err).toBeNull();
  //       expect(resp).toStrictEqual({});
  //       resolve({});
  //     });
  //   });
  //
  //   await promise;
  // });
});

// describe('DB Service Project Tests', () => {
//   let client: any;
//   beforeEach(() => {
//     const proto = ProtoLoader.loadSync([
//       join(__dirname, '../../proto/db-service/project.proto'),
//       join(__dirname, '../../proto/db-service/shared/identifiers.proto'),
//     ]) as any;
//
//     const protoGRPC = GRPC.loadPackageDefinition(proto) as any;
//
//     client = new protoGRPC.dbservice.project.ProjectService(
//       process.env.DB_SERVICE_ADDR,
//       GRPC.credentials.createInsecure(),
//     );
//   });
//
//   it('creates a new user', async () => {
//     const promise = new Promise((resolve) => {
//       client.issueApiKey({}, (err, resp) => {
//         expect(err).toBeNull();
//         expect(resp).toStrictEqual({});
//         resolve({});
//       });
//     });
//
//     await promise;
//   });
//
//   it('updates a user', async () => {
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
//
//   it('gets a user', async () => {
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
//
//   it('deletes a user', async () => {
//     const promise = new Promise((resolve) => {
//       client.issueApiKey({}, (err, resp) => {
//         expect(err).toBeNull();
//         expect(resp).toStrictEqual({});
//         resolve({});
//       });
//     });
//
//     await promise;
//   });
// });
