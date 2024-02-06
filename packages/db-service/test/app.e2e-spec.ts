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
import { UserType } from 'juno-proto/dist/gen/user';

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
  let userClient: any;
  let projectClient: any;

  beforeEach(() => {
    const userProto = ProtoLoader.loadSync([
      UserProtoFile,
      ProjectProtoFile,
      IdentifiersProtoFile,
    ]) as any;

    const userProtoGRPC = GRPC.loadPackageDefinition(userProto) as any;

    userClient = new userProtoGRPC.dbservice.user.UserService(
      process.env.DB_SERVICE_ADDR,
      GRPC.credentials.createInsecure(),
    );

    projectClient = new userProtoGRPC.dbservice.project.ProjectService(
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

  it('can link a valid user to a project', async () => {
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
          expect(resp['type']).toBe(UserType.SUPERADMIN);
          resolve({});
        },
      );
    });

    await promise1;
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

    await userPromise;

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

    await getUserPromise;
  });

  // TODO: Wait for top level handler to manage invalid inputs
  // it('throws an exception when updating the user with a invalid id', async () => {
  //   const promise = new Promise((resolve) => {
  //     userClient.updateUser(
  //       {
  //         userIdentifier: { id: 99999 },
  //         updateParams: { email: 'test@test.com' },
  //       },
  //       (err, resp) => {
  //         expect(err).toBeDefined();
  //         resolve({});
  //       },
  //     );
  //   }).catch((err) => {
  //     expect(err).toBeNull();
  //   });

  //   await promise;
  // });
  // it('throws an error when neither id nor email are provided', async () => {
  //   const getUserPromise = new Promise((resolve) => {
  //     userClient.getUser({}, (err, resp) => {
  //       expect(err).toBe('');
  //       resolve({});
  //     });
  //   });

  //   // Expect error, TODO: Find method of catching "Internal server error"
  //   expect(await getUserPromise).toThrow(Error);
  // });
});

describe('DB Service Project Tests', () => {
  let projectClient: any;
  let userClient: any;
  beforeEach(() => {
    const proto = ProtoLoader.loadSync([
      ProjectProtoFile,
      IdentifiersProtoFile,
      UserProtoFile,
    ]) as any;

    const protoGRPC = GRPC.loadPackageDefinition(proto) as any;

    projectClient = new protoGRPC.dbservice.project.ProjectService(
      process.env.DB_SERVICE_ADDR,
      GRPC.credentials.createInsecure(),
    );
    userClient = new protoGRPC.dbservice.user.UserService(
      process.env.DB_SERVICE_ADDR,
      GRPC.credentials.createInsecure(),
    );
  });
  // Logic for cleaning up created project ids.
  let createdProjectIds: number[] = [];
  afterEach(async () => {
    await Promise.all(
      createdProjectIds.map(
        (id) =>
          new Promise((resolve, reject) => {
            projectClient.deleteProject({ id: id }, (err, resp) => {
              if (err) reject(err);
              else resolve(resp);
            });
          }),
      ),
    );
    createdProjectIds = [];
  });

  it('creates a new project', async () => {
    await new Promise((resolve) => {
      projectClient.createProject(
        {
          name: 'test',
        },
        (err, resp) => {
          expect(err).toBeNull();
          expect(resp['name']).toBe('test');
          createdProjectIds.push(resp.id);
          resolve({});
        },
      );
    });
  });

  it('gets a project', async () => {
    const originalProject: ProjectProto.Project = await new Promise(
      (resolve) => {
        projectClient.createProject(
          {
            name: 'test',
          },
          (err, resp) => {
            expect(err).toBeNull();
            resolve(resp);
          },
        );
      },
    );
    const retrievedProject = await new Promise((resolve) => {
      projectClient.getProject(
        {
          id: originalProject['id'],
        },
        (err, resp) => {
          expect(err).toBeNull();
          createdProjectIds.push(resp.id);
          resolve(resp);
        },
      );
    });
    expect(retrievedProject == originalProject);
  });

  // Cannot validate yet because no top level handler for the controller
  // it('validates identifier', async () => {
  //   const req: ProjectProto.UpdateProjectRequest = {
  //     projectIdentifier: {
  //       id: 0,
  //       name: 'test',
  //     },
  //     updateParams: { name: 'updated' },
  //   };
  //   await new Promise((resolve) => {
  //     projectClient.updateProject(req, (err) => {
  //       expect(err).toThrow(Error);
  //       // expect(err.message).toBe("Only one of id or name can be provided");
  //       resolve({});
  //     });
  //   });
  //   req.projectIdentifier = {};
  //   await new Promise((resolve) => {
  //     projectClient.updateProject(req, (err) => {
  //       expect(err).toThrow(Error);
  //       // expect(err.message).toBe("Neither id nor name are provided");
  //       resolve({});
  //     });
  //   });
  // });

  it('updates a project', async () => {
    const project: ProjectProto.Project = await new Promise((resolve) => {
      projectClient.createProject(
        {
          name: 'test',
        },
        (err, resp) => {
          expect(err).toBeNull();
          resolve(resp);
        },
      );
    });
    const req: ProjectProto.UpdateProjectRequest = {
      projectIdentifier: {
        id: project['id'],
      },
      updateParams: { name: 'updated' },
    };
    await new Promise((resolve) => {
      projectClient.updateProject(req, (err, resp) => {
        expect(err).toBeNull();
        expect(resp['name']).toBe('updated');
        createdProjectIds.push(resp['id']);
        resolve({});
      });
    });
  });

  it('deletes a project', async () => {
    const project: ProjectProto.Project = await new Promise((resolve) => {
      projectClient.createProject(
        {
          name: 'test',
        },
        (err, resp) => {
          expect(err).toBeNull();
          resolve(resp);
        },
      );
    });
    await new Promise((resolve) => {
      projectClient.deleteProject({ id: project['id'] }, (err) => {
        expect(err).toBeNull();
        resolve({});
      });
    });
    await new Promise((resolve) => {
      projectClient.getProject({ id: project['id'] }, (err) => {
        expect(err).toBeInstanceOf(Error);
        resolve({});
      });
    });
  });

  it('links a user', async () => {
    await new Promise((resolve) => {
      userClient.createUser(
        {
          email: 'test@testemail.com',
          password: 'some-password',
          name: 'test-name',
          type: 'SUPERADMIN',
        },
        (err, resp) => {
          expect(err).toBeNull();
          expect(resp['email']).toBe('test@testemail.com');
          expect(resp['name']).toBe('test-name');
          expect(resp['type']).toBe(0);
          resolve({});
        },
      );
    });
    const project: ProjectProto.Project = await new Promise((resolve) => {
      projectClient.createProject(
        {
          name: 'test',
        },
        (err, resp) => {
          expect(err).toBeNull();
          resolve(resp);
        },
      );
    });
    const req: ProjectProto.LinkUserToProjectRequest = {
      project: { id: project.id },
      user: { email: 'test@testemail.com' },
    };
    await new Promise((resolve) => {
      projectClient.linkUser(req, (err, resp) => {
        expect(err).toBeNull();
        createdProjectIds.push(resp.id);
        resolve({});
      });
    });
  });
});
