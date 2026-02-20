import { Test, TestingModule } from '@nestjs/testing';
import { INestMicroservice } from '@nestjs/common';
import { AppModule } from './../src/app.module';
import * as ProtoLoader from '@grpc/proto-loader';
import * as GRPC from '@grpc/grpc-js';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import {
  ApiKeyProto,
  ApiKeyProtoFile,
  CommonProto,
  EmailProto,
  EmailProtoFile,
  IdentifiersProtoFile,
  ProjectProto,
  ProjectProtoFile,
  ResetProto,
  ResetProtoFile,
  UserProto,
  UserProtoFile,
} from 'juno-proto';
import { ApiKey } from '@prisma/client';

const { JUNO_USER_PACKAGE_NAME } = UserProto;
const { JUNO_PROJECT_PACKAGE_NAME } = ProjectProto;
const { JUNO_API_KEY_PACKAGE_NAME } = ApiKeyProto;
const { JUNO_EMAIL_PACKAGE_NAME } = EmailProto;

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
        JUNO_API_KEY_PACKAGE_NAME,
        JUNO_USER_PACKAGE_NAME,
        JUNO_PROJECT_PACKAGE_NAME,
        JUNO_EMAIL_PACKAGE_NAME,
        ResetProto.JUNO_RESET_DB_PACKAGE_NAME,
      ],
      protoPath: [
        UserProtoFile,
        ProjectProtoFile,
        IdentifiersProtoFile,
        ResetProtoFile,
        ApiKeyProtoFile,
        EmailProtoFile,
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

  const proto = ProtoLoader.loadSync([
    ResetProtoFile,
    ProjectProtoFile,
    IdentifiersProtoFile,
    EmailProtoFile,
  ]) as any;

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

  const projectClient = new protoGRPC.juno.project.ProjectService(
    process.env.DB_SERVICE_ADDR,
    GRPC.credentials.createInsecure(),
  );

  await new Promise((resolve, reject) => {
    projectClient.createProject(
      { name: 'apiKeyTestProject' },
      (err: any, resp: any) => {
        if (err) reject(err);
        else resolve(resp);
      },
    );
  });

  app.close();
});

beforeEach(async () => {
  app = await initApp();
});

afterEach(async () => {
  app.close();
});

describe('DB Service API Key Tests', () => {
  let apiKeyClient: any;
  beforeEach(() => {
    const proto = ProtoLoader.loadSync([ApiKeyProtoFile]) as any;

    const protoGRPC = GRPC.loadPackageDefinition(proto) as any;
    apiKeyClient = new protoGRPC.juno.api_key.ApiKeyDbService(
      process.env.DB_SERVICE_ADDR,
      GRPC.credentials.createInsecure(),
    );
  });

  it('creates a new api key', async () => {
    const response: ApiKey = await new Promise((resolve, reject) => {
      apiKeyClient.createApiKey(
        {
          apiKey: {
            hash: 'f2b8baf5507e8dd5df6fc00f9fb544f5ca9a41faf6d612cdc2b172082d1625b7',
            description: 'Valid API key',
            scopes: [0],
            project: { name: 'apiKeyTestProject' },
            environment: 'dev',
          },
        },
        (err, res) => {
          if (err) {
            reject(err);
          } else {
            resolve(res);
          }
        },
      );
    });

    expect(response).toHaveProperty('id');
    expect(response).toHaveProperty(
      'hash',
      'f2b8baf5507e8dd5df6fc00f9fb544f5ca9a41faf6d612cdc2b172082d1625b7',
    );
    expect(response).toHaveProperty('description', 'Valid API key');
    expect(response).toHaveProperty('project');
    expect(response).toHaveProperty('environment', 'dev');
  });
});

describe('DB Service Account Request Tests', () => {
  let accountRequestClient: any;

  beforeEach(() => {
    const proto = ProtoLoader.loadSync([
      UserProtoFile,
      IdentifiersProtoFile,
    ]) as any;

    const protoGRPC = GRPC.loadPackageDefinition(proto) as any;

    accountRequestClient = new protoGRPC.juno.user.AccountRequestService(
      process.env.DB_SERVICE_ADDR,
      GRPC.credentials.createInsecure(),
    );
  });

  it('creates a new account request', async () => {
    const resp: any = await new Promise((resolve) => {
      accountRequestClient.createAccountRequest(
        {
          email: 'newuser@test.com',
          name: 'New User',
          password: 'securepassword',
          userType: 'USER',
          projectName: 'my-project',
        },
        (err, resp) => {
          expect(err).toBeNull();
          resolve(resp);
        },
      );
    });

    expect(resp['email']).toBe('newuser@test.com');
    expect(resp['name']).toBe('New User');
    expect(resp['userType']).toBe(CommonProto.UserType.USER);
    expect(resp['projectName']).toBe('my-project');
    expect(resp['id']).toBeDefined();
    expect(resp['createdAt']).toBeDefined();
  });

  it('gets all account requests', async () => {
    await new Promise((resolve) => {
      accountRequestClient.createAccountRequest(
        {
          email: 'getall1@test.com',
          name: 'Get All User 1',
          password: 'password',
          userType: 'USER',
        },
        (err) => {
          expect(err).toBeNull();
          resolve(0);
        },
      );
    });

    const requests: any = await new Promise((resolve) => {
      accountRequestClient.getAllAccountRequests({}, (err, resp) => {
        expect(err).toBeNull();
        resolve(resp);
      });
    });

    expect(requests['requests']).toBeDefined();
    expect(requests['requests'].length).toBeGreaterThanOrEqual(1);
  });

  it('deletes an account request by id', async () => {
    const created: any = await new Promise((resolve) => {
      accountRequestClient.createAccountRequest(
        {
          email: 'toremove@test.com',
          name: 'To Remove',
          password: 'password',
          userType: 'USER',
        },
        (err, resp) => {
          expect(err).toBeNull();
          resolve(resp);
        },
      );
    });

    const removedId = created['id'];

    const removed: any = await new Promise((resolve) => {
      accountRequestClient.deleteAccountRequest(
        { id: removedId },
        (err, resp) => {
          expect(err).toBeNull();
          expect(resp['email']).toBe('toremove@test.com');
          resolve(resp);
        },
      );
    });

    expect(removed['id']).toEqual(removedId);

    const allAfterRemoval: any = await new Promise((resolve) => {
      accountRequestClient.getAllAccountRequests({}, (err, resp) => {
        expect(err).toBeNull();
        resolve(resp);
      });
    });

    const ids = (allAfterRemoval['requests'] || []).map(
      (r: any) => `${r['id']}`,
    );
    expect(ids).not.toContain(`${removedId}`);
  });

  it('fails to delete a non-existent request', async () => {
    await new Promise((resolve) => {
      accountRequestClient.deleteAccountRequest({ id: 999999 }, (err) => {
        expect(err).toBeDefined();
        expect(err.code).toBe(GRPC.status.NOT_FOUND);
        resolve({});
      });
    });
  });
});
