import { Test, TestingModule } from '@nestjs/testing';
import { INestMicroservice } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import * as ProtoLoader from '@grpc/proto-loader';
import * as GRPC from '@grpc/grpc-js';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { FileServiceConfig, FileServiceConfigProtoFile } from 'juno-proto';

let app: INestMicroservice;
let createdConfigId: string;

jest.setTimeout(15000);

async function initApp() {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: ['juno.file_service.config'],
      protoPath: [FileServiceConfigProtoFile],
      url: process.env.DB_SERVICE_ADDR,
    },
  });

  await app.init();
  await app.listen();
  return app;
}

beforeAll(async () => {
  app = await initApp();
});

afterEach(async () => {
  await app.close();
});

describe('File Service Config Tests', () => {
  let configClient: any;

  beforeEach(() => {
    const proto = ProtoLoader.loadSync([FileServiceConfigProtoFile]) as any;
    const protoGRPC = GRPC.loadPackageDefinition(proto) as any;
    configClient =
      new protoGRPC.juno.file_service.config.FileServiceFileServiceConfigDbService(
        process.env.DB_SERVICE_ADDR,
        GRPC.credentials.createInsecure(),
      );
  });

  it('creates a new file service config', async () => {
    const response: FileServiceConfig = await new Promise((resolve, reject) => {
      configClient.createConfig(
        {
          config: {
            projectId: '1',
            buckets: [],
            files: [],
          },
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
    });

    expect(response).toHaveProperty('id');
  });

  it('creates a duplicate file service config', async () => {
    try {
      await new Promise((resolve, reject) => {
        configClient.createConfig(
          {
            config: {
              projectId: '1',
              buckets: [],
              files: [],
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
    } catch (err) {
      expect(err).toBeDefined();
    }
  });

  it('deletes a config', async () => {
    const deleteResponse = await new Promise((resolve, reject) => {
      configClient.deleteConfig({ id: createdConfigId }, (err, res) => {
        if (err) {
          reject(err);
        } else {
          resolve(res);
        }
      });
    });

    expect(deleteResponse).toHaveProperty('id', createdConfigId);
  });

  it('deletes a nonexistent config', async () => {
    try {
      await new Promise((resolve, reject) => {
        configClient.deleteConfig({ id: 'nonexistent-id' }, (err, res) => {
          if (err) {
            reject(err);
          } else {
            resolve(res);
          }
        });
      });
    } catch (err) {
      expect(err).toBeDefined();
    }
  });

  it('updates a config', async () => {
    const updateResponse = await new Promise((resolve, reject) => {
      configClient.updateConfig(
        {
          id: createdConfigId,
          config: {
            projectId: '1',
            buckets: [],
            files: [],
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

    expect(updateResponse).toHaveProperty('id', createdConfigId);
  });

  it('reading a nonexistent config', async () => {
    try {
      await new Promise((resolve, reject) => {
        configClient.getConfig({ id: 'nonexistent-id' }, (err, res) => {
          if (err) {
            reject(err);
          } else {
            resolve(res);
          }
        });
      });
    } catch (err) {
      expect(err).toBeDefined();
    }
  });

  it('reading a config', async () => {
    const readResponse: FileServiceConfig = await new Promise(
      (resolve, reject) => {
        configClient.getConfig({ id: createdConfigId }, (err, res) => {
          if (err) {
            reject(err);
          } else {
            resolve(res);
          }
        });
      },
    );

    expect(readResponse).toHaveProperty('id', createdConfigId);
  });
});
