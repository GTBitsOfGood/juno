import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, INestMicroservice } from '@nestjs/common';
import { AppModule } from './../src/app.module';
import * as ProtoLoader from '@grpc/proto-loader';
import * as GRPC from '@grpc/grpc-js';
import {
  MicroserviceOptions,
  RpcException,
  Transport,
} from '@nestjs/microservices';
import {
  IdentifiersProtoFile,
  ProjectProto,
  ProjectProtoFile,
  UserProto,
  UserProtoFile,
} from 'juno-proto';
import { assert } from 'console';
import { UserType } from 'juno-proto/dist/gen/user';
import { join, resolve } from 'path';

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

  // it('throws an error when attempting to update user without providing an id', async () => {
  //   const problematicCode = async () => {
  //     const promise = new Promise(() => {
  //       client.updateUser({ email: '' });
  //     });

  //     await promise;
  //   };

  //   await expect(problematicCode()).rejects.toThrow(Error);
  // });

  // it('throws an error when attempting to update user without providing an id or email', async () => {
  //   try {
  //     await client.updateUser(
  //       {
  //         userIdentifier: {},
  //         updateParams: {},
  //       },
  //       (err) => {
  //         expect(err).toBeDefined();
  //       },
  //     );
  //   } catch (e) {
  //     expect(e).toBe(' ');
  //   }
  // });

  it('throws an exception when updating the user with a invalid id', async () => {
    const promise = new Promise((resolve) => {
      client.updateUser(
        {
          userIdentifier: { id: 99999 },
          updateParams: { email: 'test@test.com' },
        },
        (err, resp) => {
          expect(err).toBeDefined();
          resolve({});
        },
      );
    }).catch((err) => {
      expect(err).toBeNull();
    });

    await promise;
  });

  it('can update the user with a valid id', async () => {
    const promise = new Promise((resolve) => {
      client.updateUser(
        {
          userIdentifier: { id: 1 },
          updateParams: {
            email: 'new@test.com',
            name: 'new',
            type: UserType.USER,
          },
        },
        (err, resp) => {
          expect(err).toBeNull();
          expect(resp['email']).toBe('new@test.com');
          expect(resp['name']).toBe('new');
          expect(resp['type']).toBe(UserType.USER);
          resolve({});
        },
      );
    });

    await promise;
  });

  it('can update the user with a valid id', async () => {
    const promise = new Promise((resolve) => {
      client.updateUser(
        {
          userIdentifier: { id: 1 },
          updateParams: {
            email: 'new@test.com',
            name: 'new',
            type: UserType.USER,
          },
        },
        (err, resp) => {
          expect(err).toBeNull();
          expect(resp['email']).toBe('new@test.com');
          expect(resp['name']).toBe('new');
          expect(resp['type']).toBe(UserType.USER);
          resolve({});
        },
      );
    });

    await promise;
  });

  it('can remove the user with a valid id', async () => {
    const promise = new Promise((resolve) => {
      client.deleteUser(
        {
          id: 1,
        },
        (err, resp) => {
          expect(err).toBeNull();
          expect(resp).toBeDefined();
          resolve({});
        },
      );
    });

    await promise;
  });

  it('can link a valid user to a project', async () => {
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
          expect(`${resp['id']}`).toBe('2');
          expect(resp['email']).toBe('test@test.com');
          expect(resp['name']).toBe('some-name');
          expect(resp['type']).toBe(0);
          resolve({});
        },
      );
    });

    await promise;

    const promise1 = new Promise((resolve) => {
      client.linkProject(
        {
          project: { id: 0 },
          user: { id: 2 },
        },
        (err, resp) => {
          expect(err).toBeNull();
          expect(resp['email']).toBe('new@test.com');
          expect(resp['name']).toBe('new');
          expect(resp['type']).toBe(UserType.USER);
          resolve({});
        },
      );
    });

    await promise1;

    // const promise2 = new Promise((resolve) => {
    //   client.deleteUser(
    //     {
    //       id: 1,
    //     },
    //     (err, resp) => {
    //       expect(err).toBeNull();
    //       expect(resp).toBeDefined();
    //       resolve({});
    //     },
    //   );
    // });

    // await promise2;
  });

  /**
   * Create User:
   * - email is invalid email
   * - email is empty
   * - email is blank string
   * - password is blank
   * - password is empty string
   */

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
  // });

  // describe('DB Service Project Tests', () => {
  //   let client: any;
  //   beforeEach(() => {
  //     const proto = ProtoLoader.loadSync([
  //       join(__dirname, '../../proto/db-service/project.proto'),
  //       join(__dirname, '../../proto/db-service/shared/identifiers.proto'),
  //     ]) as any;

  //     const protoGRPC = GRPC.loadPackageDefinition(proto) as any;

  //     client = new protoGRPC.dbservice.project.ProjectService(
  //       process.env.DB_SERVICE_ADDR,
  //       GRPC.credentials.createInsecure(),
  //     );
  //   });

  // it('creates a new user', async () => {
  //   const promise = new Promise((resolve) => {
  //     client.issueApiKey({}, (err, resp) => {
  //       expect(err).toBeNull();
  //       expect(resp).toStrictEqual({});
  //       resolve({});
  //     });
  //   });

  //   await promise;
  // });

  // it('updates a user', async () => {
  //   const promise = new Promise((resolve) => {
  //     client.revokeApiKey({}, (err, resp) => {
  //       expect(err).toBeNull();
  //       expect(resp).toStrictEqual({});
  //       resolve({});
  //     });
  //   });

  //   await promise;
  // });

  // it('gets a user', async () => {
  //   const promise = new Promise((resolve) => {
  //     client.revokeApiKey({}, (err, resp) => {
  //       expect(err).toBeNull();
  //       expect(resp).toStrictEqual({});
  //       resolve({});
  //     });
  //   });

  //   await promise;
  // });

  // it('deletes a user', async () => {
  //   const promise = new Promise((resolve) => {
  //     client.issueApiKey({}, (err, resp) => {
  //       expect(err).toBeNull();
  //       expect(resp).toStrictEqual({});
  //       resolve({});
  //     });
  //   });

  // await promise;
  // });
});
