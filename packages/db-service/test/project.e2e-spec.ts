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
  UserProto,
  UserProtoFile,
} from 'juno-proto';

const { JUNO_USER_PACKAGE_NAME } = UserProto;
const { JUNO_PROJECT_PACKAGE_NAME } = ProjectProto;

let app: INestMicroservice;

jest.setTimeout(10000);

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
