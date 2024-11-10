import { Test, TestingModule } from '@nestjs/testing';
import { INestMicroservice } from '@nestjs/common';
import { AppModule } from './../src/app.module';
import * as ProtoLoader from '@grpc/proto-loader';
import * as GRPC from '@grpc/grpc-js';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import {
  FileProviderProto,
  FileProviderProtoFile,
  ResetProtoFile,
} from 'juno-proto';

let app: INestMicroservice;

jest.setTimeout(15000);

async function initApp() {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: [FileProviderProto.JUNO_FILE_SERVICE_PROVIDER_PACKAGE_NAME],
      protoPath: [FileProviderProtoFile],
      url: process.env.FILE_SERVICE_ADDR,
    },
  });

  await app.init();

  await app.listen();
  return app;
}

beforeEach(async () => {
  app = await initApp();
});

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

afterEach(() => {
  app.close();
});

describe('File Provider Tests', () => {
  let fileProviderClient: any;

  beforeEach(async () => {
    const proto = ProtoLoader.loadSync([FileProviderProtoFile]) as any;

    // TODO once a controller is implemented, create the client for that service
    const protoGRPC = GRPC.loadPackageDefinition(proto) as any;

    // good to note that juno.file_service.provider is used because that is the proto package
    // FileProviderFileService is the Grpc method name in gen/file_provider.ts
    fileProviderClient =
      new protoGRPC.juno.file_service.provider.FileProviderFileService(
        process.env.FILE_SERVICE_ADDR,
        GRPC.credentials.createInsecure(),
      );
  });

  it('Register a provider with valid parameters', async () => {
    try {
      const registerRequest = {
        accessKey: 'accessKey',
        baseUrl: 'https://aws.amazon.com',
        providerName: 'test_provider',
      };
      const response = await new Promise((resolve) => {
        fileProviderClient.registerProvider(
          registerRequest,
          (err: any, resp: any) => {
            expect(err).toBeNull();
            resolve(resp);
          },
        );
      });
      expect(response).toBeDefined();
    } catch (err) {
      expect(err).toBeUndefined();
    }
  });

  it('Register a provider with empty accessKey', async () => {
    try {
      const registerRequest = {
        accessKey: '',
        baseUrl: 'https://aws.amazon.com',
        providerName: 'test_provider',
      };
      await new Promise((resolve) => {
        fileProviderClient.registerProvider(
          registerRequest,
          (err: any, resp: any) => {
            expect(err).not.toBeNull();
            resolve(resp);
          },
        );
      });
      fail('Expected error to be thrown');
    } catch (err) {
      expect(err).not.toBeNull();
    }
  });

  it('Register a provider with empty base url', async () => {
    try {
      const registerRequest = {
        accessKey: 'accessKey',
        baseUrl: '',
        providerName: 'test_provider',
      };
      await new Promise((resolve) => {
        fileProviderClient.registerProvider(
          registerRequest,
          (err: any, resp: any) => {
            expect(err).not.toBeNull();
            resolve(resp);
          },
        );
      });
      fail('Expected error to be thrown');
    } catch (err) {
      expect(err).not.toBeNull();
    }
  });
  it('Register a provider with empty provider name', async () => {
    try {
      const registerRequest = {
        accessKey: 'accessKey',
        baseUrl: 'https://aws.amazon.com',
        providerName: '',
      };
      await new Promise((resolve) => {
        fileProviderClient.registerProvider(
          registerRequest,
          (err: any, resp: any) => {
            expect(err).not.toBeNull();
            resolve(resp);
          },
        );
      });
      fail('Expected error to be thrown');
    } catch (err) {
      expect(err).not.toBeNull();
    }
  });
});
