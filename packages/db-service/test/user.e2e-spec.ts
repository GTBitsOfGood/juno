import { Test, TestingModule } from '@nestjs/testing';
import { INestMicroservice } from '@nestjs/common';
import { AppModule } from './../src/app.module';
import * as ProtoLoader from '@grpc/proto-loader';
import * as GRPC from '@grpc/grpc-js';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { isSubset } from 'src/utility/checksubset';
import { isEqual } from 'lodash';
import {
  CommonProto,
  IdentifiersProtoFile,
  ProjectProto,
  ProjectProtoFile,
  ResetProto,
  ResetProtoFile,
  UserProto,
  UserProtoFile,
} from 'juno-proto';

const { JUNO_USER_PACKAGE_NAME } = UserProto;
const { JUNO_PROJECT_PACKAGE_NAME } = ProjectProto;

let app: INestMicroservice;

jest.setTimeout(15000);

async function initApp() {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: [
        JUNO_USER_PACKAGE_NAME,
        JUNO_PROJECT_PACKAGE_NAME,
        ResetProto.JUNO_RESET_DB_PACKAGE_NAME,
      ],
      protoPath: [
        UserProtoFile,
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

describe('DB Service User Tests', () => {
  let userClient: any;
  let projectClient: any;

  beforeEach(() => {
    const userProto = ProtoLoader.loadSync([
      UserProtoFile,
      ProjectProtoFile,
      IdentifiersProtoFile,
    ]) as any;

    const userProtoGRPC = GRPC.loadPackageDefinition(userProto) as any;

    userClient = new userProtoGRPC.juno.user.UserService(
      process.env.DB_SERVICE_ADDR,
      GRPC.credentials.createInsecure(),
    );

    projectClient = new userProtoGRPC.juno.project.ProjectService(
      process.env.DB_SERVICE_ADDR,
      GRPC.credentials.createInsecure(),
    );
  });

  it('creates a new user', async () => {
    const promise = new Promise((resolve) => {
      userClient.createUser(
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

  it('can update the user with a valid id', async () => {
    const promise = new Promise((resolve) => {
      userClient.updateUser(
        {
          userIdentifier: { id: 1 },
          updateParams: {
            email: 'new@test.com',
            name: 'new',
            type: CommonProto.UserType.USER,
          },
        },
        (err, resp) => {
          expect(err).toBeNull();
          expect(resp['email']).toBe('new@test.com');
          expect(resp['name']).toBe('new');
          expect(resp['type']).toBe(CommonProto.UserType.USER);
          resolve({});
        },
      );
    });

    await promise;
  });

  it('can remove the user with a valid id', async () => {
    const promise = new Promise((resolve) => {
      userClient.deleteUser(
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

  it('can link and unlink a valid user to/from multiple projects', async () => {
    // Create two projects
    const projectPromise = new Promise((resolve) => {
      projectClient.createProject(
        {
          name: 'testproject',
        },
        (err, resp) => {
          expect(err).toBeNull();
          expect(resp['name']).toBe('testproject');
          resolve({});
        },
      );
    });

    await projectPromise;

    const project2Promise = new Promise((resolve) => {
      projectClient.createProject(
        {
          name: 'testproject2',
        },
        (err, resp) => {
          expect(err).toBeNull();
          expect(resp['name']).toBe('testproject2');
          resolve({});
        },
      );
    });

    await project2Promise;

    // Create a user
    const promise = new Promise((resolve) => {
      userClient.createUser(
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

    // Link the user to the first project
    const promise1 = new Promise((resolve) => {
      userClient.linkProject(
        {
          project: { name: 'testproject' },
          user: { id: 2 },
        },
        (err, resp) => {
          expect(err).toBeNull();
          expect(resp['email']).toBe('test@test.com');
          expect(resp['name']).toBe('some-name');
          expect(resp['type']).toBe(CommonProto.UserType.SUPERADMIN);
          expect(resp['projectIds'].map((id) => Number(id))).toStrictEqual([1]);
          resolve({});
        },
      );
    });

    await promise1;

    // Link the user to the second project
    const promise2 = new Promise((resolve) => {
      userClient.linkProject(
        {
          project: { name: 'testproject2' },
          user: { id: 2 },
        },
        (err, resp) => {
          expect(err).toBeNull();
          expect(resp['email']).toBe('test@test.com');
          expect(resp['name']).toBe('some-name');
          expect(resp['type']).toBe(CommonProto.UserType.SUPERADMIN);
          expect(resp['projectIds'].map((id) => Number(id))).toStrictEqual([
            1, 2,
          ]);
          resolve({});
        },
      );
    });

    await promise2;

    // Unlink the user from the first project
    const unlinkPromise1 = new Promise((resolve) => {
      userClient.unlinkProject(
        {
          project: { name: 'testproject' },
          user: { id: 2 },
        },
        (err, resp) => {
          expect(err).toBeNull();
          expect(resp['email']).toBe('test@test.com');
          expect(resp['name']).toBe('some-name');
          expect(resp['type']).toBe(CommonProto.UserType.SUPERADMIN);
          expect(resp['projectIds'].map((id) => Number(id))).toStrictEqual([2]);
          resolve({});
        },
      );
    });

    await unlinkPromise1;

    // Unlink the user from the second project
    const unlinkPromise2 = new Promise((resolve) => {
      userClient.unlinkProject(
        {
          project: { name: 'testproject2' },
          user: { id: 2 },
        },
        (err, resp) => {
          expect(err).toBeNull();
          expect(resp['email']).toBe('test@test.com');
          expect(resp['name']).toBe('some-name');
          expect(resp['type']).toBe(CommonProto.UserType.SUPERADMIN);
          expect(resp['projectIds']).toBeUndefined();
          resolve({});
        },
      );
    });

    await unlinkPromise2;
  });

  it('can get a valid user', async () => {
    const userPromise = new Promise((resolve) => {
      userClient.createUser(
        {
          email: 'testvaliduser@test.com',
          password: 'some-password',
          name: 'some-name',
          type: 'SUPERADMIN',
        },
        (err, resp) => {
          expect(err).toBeNull();
          expect(resp['email']).toBe('testvaliduser@test.com');
          expect(resp['name']).toBe('some-name');
          expect(resp['type']).toBe(0);
          resolve({});
        },
      );
    });

    const user1 = await userPromise;

    const getUserPromise = new Promise((resolve) => {
      userClient.getUser(
        {
          email: 'test@test.com',
        },
        (err, resp) => {
          expect(err).toBeNull();
          expect(resp).toBeDefined();
          expect(resp['email']).toBe('test@test.com');
          expect(resp['name']).toBe('some-name');
          expect(resp['type']).toBe(0);
          resolve({});
        },
      );
    });

    const user2 = await getUserPromise;

    expect(isEqual(user1, user2)).toBe(true);
  });

  it('gets all users', async () => {
    //Users don't seem to be getting reset at thend of this test
    const user1: CommonProto.User = await new Promise((resolve) => {
      userClient.createUser(
        {
          email: 'randomemail1@test.com',
          password: 'some-password',
          name: 'some-name',
          type: 'SUPERADMIN',
        },
        (err, resp) => {
          expect(err).toBeNull();
          resolve(resp);
        },
      );
    });
    const user2: CommonProto.User = await new Promise((resolve) => {
      userClient.createUser(
        {
          email: 'randomemail3@test.com',
          password: 'some-password1',
          name: 'some-name-1',
          type: 'ADMIN',
        },
        (err, resp) => {
          expect(err).toBeNull();
          resolve(resp);
        },
      );
    });

    const expected_users: CommonProto.Users = {
      users: [user1, user2],
    };

    const users: CommonProto.Users = await new Promise((resolve) => {
      userClient.getAllUsers({}, (err, resp) => {
        expect(err).toBeNull();
        resolve(resp);
      });
    });
    expect(isSubset(expected_users.users, users.users)).toEqual(true);
  });

  it('can get a valid user password hash', async () => {
    const createUserPromise = new Promise((resolve, reject) => {
      userClient.createUser(
        {
          email: 'testpasswordhash@test.com',
          password: 'some-password',
          name: 'some-name',
          type: 'SUPERADMIN',
        },
        (err, resp) => {
          if (err) {
            reject(err);
          } else {
            expect(resp['email']).toBe('testpasswordhash@test.com');
            expect(resp['name']).toBe('some-name');
            expect(resp['type']).toBe(0);
            resolve(resp['id']);
          }
        },
      );
    });

    const userId = await createUserPromise;
    const getUserPasswordHashPromise = new Promise((resolve, reject) => {
      userClient.getUserPasswordHash(
        {
          id: userId,
        },
        (err, resp) => {
          if (err) {
            reject(err);
          } else {
            expect(resp).toBeDefined();
            expect(resp['hash']).toBeDefined();
            resolve({});
          }
        },
      );
    });

    await getUserPasswordHashPromise;
  });

  it('throws NOT_FOUND error when getting password hash for non-existent user by email', async () => {
    const promise = new Promise((resolve) => {
      userClient.getUserPasswordHash(
        {
          email: 'nonexistent@test.com',
        },
        (err) => {
          expect(err).toBeDefined();
          expect(err.code).toBe(GRPC.status.NOT_FOUND);
          expect(err.details).toBe('User not found');
          resolve({});
        },
      );
    });

    await promise;
  });

  it('throws NOT_FOUND error when getting password hash for non-existent user by id', async () => {
    const promise = new Promise((resolve) => {
      userClient.getUserPasswordHash(
        {
          id: 99999,
        },
        (err) => {
          expect(err).toBeDefined();
          expect(err.code).toBe(GRPC.status.NOT_FOUND);
          expect(err.details).toBe('User not found');
          resolve({});
        },
      );
    });

    await promise;
  });

  it('throws an error when both id and email are provided', async () => {
    const promise = new Promise((resolve) => {
      userClient.updateUser(
        {
          userIdentifier: { id: 99999, email: 'test@test.com' },
          updateParams: {},
        },
        (err) => {
          expect(err.code).toBe(GRPC.status.INVALID_ARGUMENT);
          expect(err.details).toBe('Only one of id or email can be provided');
          resolve({});
        },
      );
    });

    await promise;
  });
  it('throws an error when neither id nor email are provided', async () => {
    const getUserPromise = new Promise((resolve) => {
      userClient.getUser({}, (err) => {
        expect(err.code).toBe(GRPC.status.INVALID_ARGUMENT);
        expect(err.details).toBe('Neither id nor email are provided');
        resolve({});
      });
    });
    await getUserPromise;
  });
});
