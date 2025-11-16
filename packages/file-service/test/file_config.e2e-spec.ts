import * as GRPC from '@grpc/grpc-js';
import * as ProtoLoader from '@grpc/proto-loader';
import { INestMicroservice } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { Test, TestingModule } from '@nestjs/testing';
import {
  FileConfigProto,
  FileConfigProtoFile,
  ResetProtoFile,
} from 'juno-proto';
import { AppModule } from './../src/app.module';

let app: INestMicroservice;

jest.setTimeout(15000);

const TEST_SERVICE_ADDR = 'file-service:50006';

async function initApp() {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: [FileConfigProto.JUNO_FILE_SERVICE_CONFIG_PACKAGE_NAME],
      protoPath: [FileConfigProtoFile],
      url: TEST_SERVICE_ADDR,
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
});

afterAll(async () => {
  await app.close();
});

describe('File Config Tests', () => {
  let fileConfigClient: any;

  beforeEach(async () => {
    const proto = ProtoLoader.loadSync([FileConfigProtoFile]) as any;

    // TODO once a controller is implemented, create the client for that service
    const protoGRPC = GRPC.loadPackageDefinition(proto) as any;

    // good to note that juno.file_service.provider is used because that is the proto package
    // FileProviderFileService is the Grpc method name in gen/file_provider.ts
    fileConfigClient =
      new protoGRPC.juno.file_service.config.FileServiceConfigService(
        TEST_SERVICE_ADDR,
        GRPC.credentials.createInsecure(),
      );
  });

  it('Register a config with valid parameters', async () => {
    try {
      const registerRequest: FileConfigProto.SetupRequest = {
        projectId: 0,
        environment: 'test',
      };
      const response = await new Promise((resolve) => {
        fileConfigClient.setup(registerRequest, (err: any, resp: any) => {
          expect(err).toBeNull();
          resolve(resp);
        });
      });
      expect(response).toBeDefined();
    } catch (err) {
      expect(err).toBeNull();
    }
  });

  it('Register a duplicate config with valid parameters', async () => {
    try {
      const registerRequest: FileConfigProto.SetupRequest = {
        projectId: 0,
        environment: 'test',
      };
      const response = await new Promise((resolve) => {
        fileConfigClient.setup(registerRequest, (err: any, resp: any) => {
          expect(err).toBeNull();
          resolve(resp);
        });
      });
      expect(response).toBeDefined();

      const response2 = await new Promise((resolve) => {
        fileConfigClient.setup(registerRequest, (err: any, resp: any) => {
          expect(err).toBeNull();
          resolve(resp);
        });
      });
      expect(response2).toBeDefined();
    } catch (err) {
      expect(err).toBeNull();
    }
  });

  it('Delete a config with valid parameters', async () => {
    try {
      const deleteRequest: FileConfigProto.DeleteFileServiceConfigRequest = {
        id: 0,
        environment: 'prod',
      };
      const response = await new Promise((resolve) => {
        fileConfigClient.deleteConfig(deleteRequest, (err: any, resp: any) => {
          expect(err).toBeNull();
          resolve(resp);
        });
      });
      expect(response).toBeDefined();
    } catch (err) {
      expect(err).toBeNull();
    }
  });

  it('Delete a non-existent config', async () => {
    try {
      const deleteRequest: FileConfigProto.DeleteFileServiceConfigRequest = {
        id: 1,
        environment: 'prod',
      };
      await new Promise((resolve) => {
        fileConfigClient.deleteConfig(deleteRequest, (err: any, resp: any) => {
          expect(err).toBeDefined();
          resolve(resp);
        });
      });
    } catch (err) {
      expect(err).toBeDefined();
    }
  });
});
