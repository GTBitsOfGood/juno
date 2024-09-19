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
import { EmailSender } from '@prisma/client';

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

    emailClient = new emailProtoGRPC.juno.email.EmailDbService(
      process.env.DB_SERVICE_ADDR,
      GRPC.credentials.createInsecure(),
    );

    projectClient = new emailProtoGRPC.juno.project.ProjectService(
      process.env.DB_SERVICE_ADDR,
      GRPC.credentials.createInsecure(),
    );
  });

  it('creates an email registration record correctly', async () => {
    // Create email linked to test project
    const promise = new Promise((resolve) => {
      emailClient.createEmailSender(
        {
          username: 'tester123',
          domain: 'testdomain',
          configId: 0,
        },

        (err, resp) => {
          expect(err).toBeNull();
          resolve({});
        },
      );
    });

    await promise;
  });

  it('cannot create a duplicate email registration', async () => {
    // Create email linked to test project
    const promise = new Promise((resolve) => {
      emailClient.createEmailSender(
        {
          username: 'tester123',
          domain: 'testdomain',
          configId: 0,
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
      emailClient.createEmailSender(
        {
          username: 'tester1234',
          domain: 'testdomain',
          configId: 0,
        },

        (err, resp) => {
          expect(err).toBeNull();
          resolve(resp);
        },
      );
    });

    const resultingEmail = (await promise) as any;

    const deletionPromise = new Promise((resolve) => {
      emailClient.deleteEmailSender(
        {
          emailSenderIdentifier: {
            username: resultingEmail.username,
            domain: resultingEmail.domain,
          },
          configId: 0,
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
      emailClient.deleteEmailSender(
        {
          emailSenderIdentifier: {
            username: 'nonexistent',
            domain: 'nonexistent',
          },
          configId: 0,
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
      emailClient.createEmailSender(
        {
          username: 'tester12345',
          domain: 'testdomain',
          configId: 0,
        },

        (err, resp: EmailSender) => {
          expect(err).toBeNull();
          resolve(resp);
        },
      );
    });

    const email = (await promise) as any;

    const updatePromise = new Promise((resolve) => {
      emailClient.updateEmailSender(
        {
          emailSenderIdentifier: {
            username: email.username,
            domain: email.domain,
          },
          updateParams: {
            description: 'new description',
          },
        },

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        (err, resp: EmailSender) => {
          expect(err).toBeNull();
          resolve({});
        },
      );
    });

    await updatePromise;
  });

  it("cannot update an email's description of a nonexistent email registration record", async () => {
    const updatePromise = new Promise((resolve) => {
      emailClient.updateEmailSender(
        {
          emailSenderIdentifier: {
            username: 'nonexistent',
            domain: 'nonexistent',
          },
          updateParams: {
            description: 'new description',
          },
        },

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        (err, resp: EmailSender) => {
          expect(err).not.toBeNull();
          resolve({});
        },
      );
    });

    await updatePromise;
  });

  it('can retrieve an email registration record', async () => {
    const promise = new Promise((resolve) => {
      emailClient.createEmailSender(
        {
          username: 'tester123456',
          domain: 'testdomain',
          configId: 0,
        },

        (err, resp: EmailSender) => {
          expect(err).toBeNull();
          resolve(resp);
        },
      );
    });

    const email = (await promise) as any;

    const updatePromise = new Promise((resolve) => {
      emailClient.getEmailSender(
        {
          username: email.username,
          domain: 'testdomain',
        },
        (err, resp: EmailSender) => {
          expect(err).toBeNull();
          expect(resp).not.toBeNull();
          resolve({});
        },
      );
    });

    await updatePromise;
  });
});
