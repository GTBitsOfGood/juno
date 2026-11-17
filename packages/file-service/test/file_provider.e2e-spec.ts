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

const TEST_SERVICE_ADDR = 'file-service:50002';

async function initApp() {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: [FileProviderProto.JUNO_FILE_SERVICE_PROVIDER_PACKAGE_NAME],
      protoPath: [FileProviderProtoFile],
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
        TEST_SERVICE_ADDR,
        GRPC.credentials.createInsecure(),
      );
  });

  it('Register a provider with valid parameters', async () => {
    try {
      const registerRequest: FileProviderProto.RegisterProviderRequest = {
        publicAccessKey: 'accessKey',
        privateAccessKey: 'privateKey',
        baseUrl: 'https://aws.amazon.com',
        providerName: 'test_provider_success',
        configId: 0,
        configEnv: 'prod',
        type: FileProviderProto.ProviderType.S3,
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
      expect(err).toBeNull();
    }
  });

  it('Register a provider with empty public access key', async () => {
    try {
      const registerRequest: FileProviderProto.RegisterProviderRequest = {
        publicAccessKey: '',
        privateAccessKey: 'privateKey',
        baseUrl: 'https://aws.amazon.com',
        providerName: 'test_provider',
        configId: 0,
        configEnv: 'prod',
        type: FileProviderProto.ProviderType.S3,
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

  it('Register a provider with empty private access key', async () => {
    try {
      const registerRequest: FileProviderProto.RegisterProviderRequest = {
        publicAccessKey: 'accessKey',
        privateAccessKey: '',
        baseUrl: 'https://aws.amazon.com',
        providerName: 'test_provider',
        configId: 0,
        configEnv: 'prod',
        type: FileProviderProto.ProviderType.S3,
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
      const registerRequest: FileProviderProto.RegisterProviderRequest = {
        publicAccessKey: 'accessKey',
        privateAccessKey: 'privateKey',
        baseUrl: '',
        providerName: 'test_provider',
        configId: 0,
        configEnv: 'prod',
        type: FileProviderProto.ProviderType.S3,
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
      const registerRequest: FileProviderProto.RegisterProviderRequest = {
        publicAccessKey: 'accessKey',
        privateAccessKey: 'privateKey',
        baseUrl: 'https://aws.amazon.com',
        providerName: '',
        configId: 0,
        configEnv: 'prod',
        type: FileProviderProto.ProviderType.S3,
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
  it('Stores azure provider key info correctly', async () => {
    try {
      const registerRequest: FileProviderProto.RegisterProviderRequest = {
        publicAccessKey: 'accessKey',
        privateAccessKey: 'privateKey',
        baseUrl: 'https://azure.com',
        providerName: 'azure-test',
        configId: 0,
        configEnv: 'prod',
        type: FileProviderProto.ProviderType.AZURE,
      };
      await new Promise((resolve) => {
        fileProviderClient.registerProvider(
          registerRequest,
          (err: any, resp: any) => {
            expect(err).toBeNull();
            resolve(resp);
          },
        );
      });

      const provider: FileProviderProto.FileProvider = await new Promise(
        (resolve) => {
          fileProviderClient.getProvider(
            { providerName: 'azure-test', configId: 0, configEnv: 'prod' },
            (err: any, resp: any) => {
              expect(err).toBeNull();
              resolve(resp);
            },
          );
        },
      );
      expect(provider.providerName).toBe('azure-test');
      expect(provider.providerType).toBe(FileProviderProto.ProviderType.AZURE);
      expect(JSON.parse(provider.accessKey)).toBe({
        accountName: 'accessKey',
        accountKey: 'privateKey',
      });
    } catch (err) {
      expect(err).not.toBeNull();
    }
  });

  function call<T>(method: string, req: object): Promise<T> {
    return new Promise((resolve, reject) => {
      fileProviderClient[method](req, (err: any, resp: T) =>
        err ? reject(err) : resolve(resp),
      );
    });
  }

  it('Links a registered provider to the requested config', async () => {
    const provider = await call<FileProviderProto.FileProvider>(
      'registerProvider',
      {
        publicAccessKey: 'accessKey',
        privateAccessKey: 'privateKey',
        baseUrl: 'https://aws.amazon.com',
        providerName: 'scoped_provider',
        type: FileProviderProto.ProviderType.S3,
        configId: 0,
        configEnv: 'prod',
      },
    );
    expect(provider.providerName).toBe('scoped_provider');
    expect(provider.configId).toBe(0);
    expect(provider.configEnv).toBe('prod');
    expect(typeof provider.id).toBe('number');
  });

  it('Fails to register a provider without a config env', async () => {
    await expect(
      call('registerProvider', {
        publicAccessKey: 'accessKey',
        privateAccessKey: 'privateKey',
        baseUrl: 'https://aws.amazon.com',
        providerName: 'no_env_provider',
        type: FileProviderProto.ProviderType.S3,
        configId: 0,
        configEnv: '',
      }),
    ).rejects.toMatchObject({ code: GRPC.status.INVALID_ARGUMENT });
  });

  it('Fails to register a provider for a config that does not exist', async () => {
    await expect(
      call('registerProvider', {
        publicAccessKey: 'accessKey',
        privateAccessKey: 'privateKey',
        baseUrl: 'https://aws.amazon.com',
        providerName: 'orphan_provider',
        type: FileProviderProto.ProviderType.S3,
        configId: 999,
        configEnv: 'prod',
      }),
    ).rejects.toMatchObject({ code: GRPC.status.FAILED_PRECONDITION });
  });

  it('Gets providers by config id', async () => {
    const res = await call<FileProviderProto.FileProviders>(
      'getProvidersByConfigId',
      { configId: 0, configEnv: 'prod' },
    );
    const names = res.providers.map((p) => p.providerName);
    expect(names).toContain('scoped_provider');
    expect(
      res.providers.every((p) => p.configId === 0 && p.configEnv === 'prod'),
    ).toBe(true);
  });

  it('Gets no providers for a config without any', async () => {
    const res = await call<FileProviderProto.FileProviders>(
      'getProvidersByConfigId',
      { configId: 999, configEnv: 'prod' },
    );
    expect(res.providers ?? []).toEqual([]);
  });

  it('Fails to get providers by config id without a config env', async () => {
    await expect(
      call('getProvidersByConfigId', { configId: 0, configEnv: '' }),
    ).rejects.toMatchObject({ code: GRPC.status.INVALID_ARGUMENT });
  });

  it('Does not remove a provider through another config', async () => {
    await expect(
      call('removeProvider', {
        providerName: 'scoped_provider',
        configId: 999,
        configEnv: 'prod',
      }),
    ).rejects.toBeDefined();

    const res = await call<FileProviderProto.FileProviders>(
      'getProvidersByConfigId',
      { configId: 0, configEnv: 'prod' },
    );
    expect(res.providers.map((p) => p.providerName)).toContain(
      'scoped_provider',
    );
  });

  it('Removes a provider from its own config', async () => {
    const removed = await call<FileProviderProto.FileProvider>(
      'removeProvider',
      { providerName: 'scoped_provider', configId: 0, configEnv: 'prod' },
    );
    expect(removed.providerName).toBe('scoped_provider');
  });
});
