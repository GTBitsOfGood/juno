import { Test, TestingModule } from '@nestjs/testing';
import { INestMicroservice } from '@nestjs/common';
import { AppModule } from './../src/app.module';
import * as ProtoLoader from '@grpc/proto-loader';
import * as GRPC from '@grpc/grpc-js';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { isSubset } from 'src/utility/checksubset';
import { isEqual } from 'lodash';
import {
  IdentifiersProtoFile,
  ProjectProto,
  ProjectProtoFile,
  ResetProto,
  ResetProtoFile,
  UserProto,
  UserProtoFile,
  CommonProto,
  CommonProtoFile,
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

describe('DB Service Project Tests', () => {
  let projectClient: any;
  let userClient: any;
  beforeEach(() => {
    const proto = ProtoLoader.loadSync([
      ProjectProtoFile,
      CommonProtoFile,
      IdentifiersProtoFile,
      UserProtoFile,
    ]) as any;

    const protoGRPC = GRPC.loadPackageDefinition(proto) as any;

    projectClient = new protoGRPC.juno.project.ProjectService(
      process.env.DB_SERVICE_ADDR,
      GRPC.credentials.createInsecure(),
    );
    userClient = new protoGRPC.juno.user.UserService(
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
    const originalProject: CommonProto.Project = await new Promise(
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
    expect(isEqual(retrievedProject, originalProject)).toBe(true); //Expect? Expect what? This test is broken bro
  });

  it('gets all projects', async () => {
    const proj1: CommonProto.Project = await new Promise((resolve) => {
      projectClient.createProject({ name: 'test1' }, (err, resp) => {
        expect(err).toBeNull();
        createdProjectIds.push(resp.id);
        resolve(resp);
      });
    });
    const proj2: CommonProto.Project = await new Promise((resolve) => {
      projectClient.createProject({ name: 'test2' }, (err, resp) => {
        expect(err).toBeNull();
        createdProjectIds.push(resp.id);
        resolve(resp);
      });
    });

    const expected_projects: CommonProto.Projects = {
      projects: [proj1, proj2],
    };

    const projects: CommonProto.Projects = await new Promise((resolve) => {
      projectClient.getAllProjects({}, (err, resp) => {
        expect(err).toBeNull();
        resolve(resp);
      });
    });

    expect(isSubset(expected_projects.projects, projects.projects)).toEqual(
      true,
    );
  });

  it('gets all users within a project', async () => {
    //Do createdProjects have to be deleted at the end?
    //Create project
    const project: CommonProto.Project = await new Promise((resolve) => {
      projectClient.createProject({ name: 'test_project_acd' }, (err, resp) => {
        expect(err).toBeNull();
        createdProjectIds.push(resp.id);
        resolve(resp);
      });
    });
    //Create and link users
    await new Promise((resolve) => {
      userClient.createUser(
        {
          email: 'random1@test.com',
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
    const req1: ProjectProto.LinkUserToProjectRequest = {
      project: { id: project.id },
      user: { email: 'random1@test.com' },
    };
    await new Promise((resolve) => {
      projectClient.linkUser(req1, (err, resp) => {
        expect(err).toBeNull();
        resolve(resp);
      });
    });
    await new Promise((resolve) => {
      userClient.createUser(
        {
          email: 'random2@test.com',
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
    const req2: ProjectProto.LinkUserToProjectRequest = {
      project: { id: project.id },
      user: { email: 'random2@test.com' },
    };
    await new Promise((resolve) => {
      projectClient.linkUser(req2, (err, resp) => {
        expect(err).toBeNull();
        resolve(resp);
      });
    });

    //Get users (Can't get users when creating them since no project is specified then)
    const user1: CommonProto.User = await new Promise((resolve) => {
      userClient.getUser({ email: 'random1@test.com' }, (err, resp) => {
        expect(err).toBeNull();
        resolve(resp);
      });
    });
    const user2: CommonProto.User = await new Promise((resolve) => {
      userClient.getUser({ email: 'random2@test.com' }, (err, resp) => {
        expect(err).toBeNull();
        resolve(resp);
      });
    });
    const expected_users: CommonProto.Users = {
      users: [user1, user2],
    };
    const actual_users: CommonProto.Users = await new Promise((resolve) => {
      projectClient.getUsersFromProject(
        { projectId: project.id },
        (err, resp) => {
          expect(err).toBeNull();
          resolve(resp);
        },
      );
    });
    expect(isSubset(expected_users.users, actual_users.users)).toBe(true);
  });

  it('validates identifier', async () => {
    const req: ProjectProto.UpdateProjectRequest = {
      projectIdentifier: {
        id: 0,
        name: 'test',
      },
      updateParams: { name: 'updated' },
    };
    await new Promise((resolve) => {
      projectClient.updateProject(req, (err) => {
        expect(err.code).toBe(GRPC.status.INVALID_ARGUMENT);
        expect(err.details).toBe('Only one of id or name can be provided');
        console.log(err);
        resolve({});
      });
    });
    req.projectIdentifier = {};
    await new Promise((resolve) => {
      projectClient.updateProject(req, (err) => {
        expect(err.code).toBe(GRPC.status.INVALID_ARGUMENT);
        expect(err.details).toBe('Neither id nor name are provided');
        resolve({});
      });
    });
  });

  it('updates a project', async () => {
    const project: CommonProto.Project = await new Promise((resolve) => {
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
    const project: CommonProto.Project = await new Promise((resolve) => {
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
    const project: CommonProto.Project = await new Promise((resolve) => {
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
