import { Test, TestingModule } from '@nestjs/testing';
import { INestMicroservice } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import * as ProtoLoader from '@grpc/proto-loader';
import * as GRPC from '@grpc/grpc-js';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import {
  FileConfigProto,
  FileConfigProtoFile,
  ResetProto,
  ResetProtoFile,
} from 'juno-proto';

let app: INestMicroservice;
let createdConfigId: number;

jest.setTimeout(15000);

async function initApp() {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: [
        FileConfigProto.JUNO_FILE_SERVICE_CONFIG_PACKAGE_NAME,
        ResetProto.JUNO_RESET_DB_PACKAGE_NAME,
      ],
      protoPath: [FileConfigProtoFile, ResetProtoFile],
      url: process.env.DB_SERVICE_ADDR,
    },
  });

  await app.init();
  await app.listen();
  return app;
}

beforeAll(async () => {
  app = await initApp();
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
  await app.close();
});

function tryCreateConfig(configClient: any) {
  return new Promise<void>((resolve) => {
    configClient.createConfig(
      {
        projectId: 0,
        environment: 'test-env',
        buckets: [],
        files: [],
      },
      () => {
        resolve();
      },
    );
  });
}

function tryDeleteConfig(configClient: any) {
  return new Promise<void>((resolve) => {
    configClient.deleteConfig(
      {
        id: 0,
      },
      () => {
        resolve();
      },
    );
  });
}

describe('File Service Config Tests', () => {
  let configClient: any;

  beforeEach(() => {
    const proto = ProtoLoader.loadSync([FileConfigProtoFile]) as any;
    const protoGRPC = GRPC.loadPackageDefinition(proto) as any;
    configClient =
      new protoGRPC.juno.file_service.config.FileServiceConfigDbService(
        process.env.DB_SERVICE_ADDR,
        GRPC.credentials.createInsecure(),
      );
  });

  it('creates a new file service config', async () => {
    await tryDeleteConfig(configClient);
    const response: FileConfigProto.FileServiceConfig = await new Promise(
      (resolve, reject) => {
        configClient.createConfig(
          {
            projectId: 0,
            environment: 'test-env',
            buckets: [],
            files: [],
          },
          (err, res) => {
            if (err) {
              reject(err);
            } else {
              createdConfigId = res.id;
              resolve(res);
            }
          },
        );
      },
    );

    expect(response).toHaveProperty('id');
  });

  it('creates a duplicate file service config', async () => {
    try {
      await new Promise((resolve, reject) => {
        configClient.createConfig(
          {
            projectId: 0,
            environment: 'prod',
            buckets: [],
            files: [],
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
    } catch (err) {
      expect(err).toBeDefined();
    }
  });

  it('deletes a config', async () => {
    await tryCreateConfig(configClient);
    const deleteResponse = await new Promise((resolve, reject) => {
      configClient.deleteConfig(
        { id: createdConfigId, environment: 'test-env' },
        (err, res) => {
          if (err) {
            reject(err);
          } else {
            resolve(res);
          }
        },
      );
    });

    expect(deleteResponse).toHaveProperty('id', createdConfigId);
  });

  it('deletes a nonexistent config', async () => {
    try {
      await new Promise((resolve, reject) => {
        configClient.deleteConfig(
          { id: createdConfigId + 1000000, environment: 'prod' },
          (err, res) => {
            if (err) {
              reject(err);
            } else {
              resolve(res);
            }
          },
        );
      });
    } catch (err) {
      expect(err).toBeDefined();
    }
  });

  it('updates a config', async () => {
    await tryCreateConfig(configClient);
    const updateResponse = await new Promise((resolve, reject) => {
      configClient.updateConfig(
        {
          id: createdConfigId,
          environment: 'test-env',
          buckets: [],
          files: [],
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

    expect(updateResponse).toHaveProperty('id', createdConfigId);
  });

  it('reading a nonexistent config', async () => {
    try {
      await new Promise((resolve, reject) => {
        configClient.getConfig(
          { id: createdConfigId + 10000, environment: 'prod' },
          (err, res) => {
            if (err) {
              reject(err);
            } else {
              resolve(res);
            }
          },
        );
      });
    } catch (err) {
      expect(err).toBeDefined();
    }
  });

  it('reading a config', async () => {
    await tryCreateConfig(configClient);
    const readResponse: FileConfigProto.FileServiceConfig = await new Promise(
      (resolve, reject) => {
        configClient.getConfig(
          { id: createdConfigId, environment: 'test-env' },
          (err, res) => {
            if (err) {
              reject(err);
            } else {
              resolve(res);
            }
          },
        );
      },
    );

    expect(readResponse).toHaveProperty('id', createdConfigId);
  });
});
