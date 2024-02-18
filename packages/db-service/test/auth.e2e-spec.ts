import { Test, TestingModule } from '@nestjs/testing';
import { INestMicroservice } from '@nestjs/common';
import { AppModule } from './../src/app.module';
import * as ProtoLoader from '@grpc/proto-loader';
import * as GRPC from '@grpc/grpc-js';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import {
  ApiKeyProto,
  ApiKeyProtoFile,
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
        JUNO_API_KEY_PACKAGE_NAME,
        JUNO_USER_PACKAGE_NAME,
        JUNO_PROJECT_PACKAGE_NAME,
        ResetProto.JUNO_RESET_DB_PACKAGE_NAME,
      ],
      protoPath: [
        UserProtoFile,
        ProjectProtoFile,
        IdentifiersProtoFile,
        ResetProtoFile,
        ApiKeyProtoFile,
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
  });
});
