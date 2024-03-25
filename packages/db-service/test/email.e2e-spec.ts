import { INestMicroservice } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { Test, TestingModule } from '@nestjs/testing';
import * as ProtoLoader from '@grpc/proto-loader';
import * as GRPC from '@grpc/grpc-js';

import {
  EmailProtoFile,
  IdentifiersProtoFile,
  ProjectProtoFile,
  ResetProto,
  ResetProtoFile,
  EmailProto,
  ProjectProto,
} from 'juno-proto';
import { AppModule } from 'src/app.module';
import { Email } from '@prisma/client';

const { JUNO_EMAIL_PACKAGE_NAME } = EmailProto;
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
        JUNO_EMAIL_PACKAGE_NAME,
        JUNO_PROJECT_PACKAGE_NAME,
        ResetProto.JUNO_RESET_DB_PACKAGE_NAME,
      ],
      protoPath: [
        EmailProtoFile,
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

describe('DB Service Email Tests', () => {
  let emailClient: any;
  let projectClient: any;

  beforeEach(() => {
    const emailProto = ProtoLoader.loadSync([
      EmailProtoFile,
      ProjectProtoFile,
      IdentifiersProtoFile,
    ]) as any;

    const emailProtoGRPC = GRPC.loadPackageDefinition(emailProto) as any;

    emailClient = new emailProtoGRPC.juno.email.EmailService(
      process.env.DB_SERVICE_ADDR,
      GRPC.credentials.createInsecure(),
    );

    projectClient = new emailProtoGRPC.juno.project.ProjectService(
      process.env.DB_SERVICE_ADDR,
      GRPC.credentials.createInsecure(),
    );
  });

  it('creates an email registration record correctly', async () => {
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

    // Create email linked to test project
    const promise = new Promise((resolve) => {
      emailClient.createEmail(
        {
          name: 'tester123',
          project: {
            name: 'testproject',
          },
        },

        (err, resp) => {
          expect(err).toBeNull();
          console.log('ID:' + resp['id']);
          console.log(resp);
          resolve({});
        },
      );
    });

    await promise;
  });

  it('cannot create a duplicate email registration', async () => {
    // Create email linked to test project
    const promise = new Promise((resolve) => {
      emailClient.createEmail(
        {
          name: 'tester123',
          project: {
            name: 'testproject',
          },
        },

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        (err, resp) => {
          expect(err).not.toBeNull();
          resolve({});
        },
      );
    });

    await promise;
  });

  it('can delete an email registration record that exists', async () => {
    const promise = new Promise((resolve) => {
      emailClient.createEmail(
        {
          name: 'tester123',
          project: {
            name: 'testproject',
          },
        },

        (err, resp: Email) => {
          expect(err).not.toBeNull();
          resolve(resp);
        },
      );
    });

    const resultingEmail = (await promise) as Email;

    const deletionPromise = new Promise((resolve) => {
      emailClient.deleteEmail(
        {
          id: resultingEmail.name, // Use the ID of the created email for deletion
        },
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        (err, resp) => {
          expect(err).toBeNull();
          resolve({});
        },
      );
    });

    await deletionPromise;
  });

  it('cannot delete an email registration record that does not exist', async () => {
    const promise = new Promise((resolve) => {
      emailClient.deleteEmail(
        {
          id: 999999, // Use nonexistent ID
        },
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        (err, resp) => {
          expect(err).not.toBeNull();
          resolve({});
        },
      );
    });

    await promise;
  });

  it("can update an email's description of an existing email registration record", async () => {
    const promise = new Promise((resolve) => {
      emailClient.createEmail(
        {
          name: 'tester123',
          project: {
            name: 'testproject',
          },
        },

        (err, resp: Email) => {
          expect(err).not.toBeNull();
          resolve(resp);
        },
      );
    });

    await promise;

    const updatePromise = new Promise((resolve) => {
      emailClient.updateEmail(
        {
          name: 'tester123',
        },
        {
          description: 'new description',
        },

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        (err, resp: Email) => {
          expect(err).toBeNull();
          resolve({});
        },
      );
    });

    await updatePromise;
  });

  it("cannot update an email's description of a nonexistent email registration record", async () => {
    const updatePromise = new Promise((resolve) => {
      emailClient.updateEmail(
        {
          name: 'nonexistentNAME',
        },
        {
          description: 'new description',
        },

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        (err, resp: Email) => {
          expect(err).not.toBeNull();
          resolve({});
        },
      );
    });

    await updatePromise;
  });

  it('can retrieve an email registration record', async () => {
    const promise = new Promise((resolve) => {
      emailClient.createEmail(
        {
          name: 'tester12345',
          project: {
            name: 'testproject',
          },
        },

        (err, resp: Email) => {
          expect(err).not.toBeNull();
          resolve(resp);
        },
      );
    });

    await promise;

    const updatePromise = new Promise((resolve) => {
      emailClient.getEmail(
        {
          name: 'tester12345',
        },
        (err, resp: Email) => {
          expect(err).toBeNull();
          expect(resp).not.toBeNull();
          resolve({});
        },
      );
    });

    await updatePromise;
  });
});
