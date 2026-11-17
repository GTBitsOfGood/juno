import * as GRPC from '@grpc/grpc-js';
import * as ProtoLoader from '@grpc/proto-loader';
import { INestMicroservice } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { Test, TestingModule } from '@nestjs/testing';

import {
  FileConfigProto,
  FileConfigProtoFile,
  FileProviderProto,
  FileProviderProtoFile,
  ResetProto,
  ResetProtoFile,
} from 'juno-proto';
import {
  CreateFileProviderRequest,
  DeleteFileProviderRequest,
  GetFileProviderRequest,
  UpdateFileProviderRequest,
} from 'juno-proto/dist/gen/file_provider';
import { AppModule } from 'src/app.module';

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
        FileProviderProto.JUNO_FILE_SERVICE_PROVIDER_PACKAGE_NAME,
        FileConfigProto.JUNO_FILE_SERVICE_CONFIG_PACKAGE_NAME,
        ResetProto.JUNO_RESET_DB_PACKAGE_NAME,
      ],
      protoPath: [FileProviderProtoFile, FileConfigProtoFile, ResetProtoFile],
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

describe('File Provider Tests', () => {
  let fileProviderClient: any;

  beforeEach(() => {
    const fileProviderProto = ProtoLoader.loadSync([
      FileProviderProtoFile,
    ]) as any;

    const fileProviderProtoGRPC = GRPC.loadPackageDefinition(
      fileProviderProto,
    ) as any;

    fileProviderClient =
      new fileProviderProtoGRPC.juno.file_service.provider.FileProviderDbService(
        process.env.DB_SERVICE_ADDR,
        GRPC.credentials.createInsecure(),
      );
  });

  it('Creating a file provider correctly', async () => {
    const createRequest: CreateFileProviderRequest = {
      providerName: 'Test Provider1',
      configId: 0,
      configEnv: 'prod',
      accessKey: JSON.stringify({
        publicAccessKey: 'accessKey',
        privateAccessKey: 'privateKey',
      }),
      metadata: 'Test metadata',
      bucket: [],
      type: FileProviderProto.ProviderType.S3,
    };

    const promise = new Promise((resolve) => {
      fileProviderClient.createProvider(createRequest, (err, resp) => {
        expect(err).toBeNull();
        resolve(resp);
      });
    });

    await promise;
  });

  it('Creating a duplicate file provider', async () => {
    const createRequest: CreateFileProviderRequest = {
      providerName: 'Duplicate Provider',
      configId: 0,
      configEnv: 'prod',
      accessKey: JSON.stringify({
        publicAccessKey: 'accessKey',
        privateAccessKey: 'privateKey',
      }),
      metadata: 'Test metadata',
      bucket: [],
      type: FileProviderProto.ProviderType.S3,
    };

    const promise1 = new Promise((resolve) => {
      fileProviderClient.createProvider(createRequest, (err, resp) => {
        expect(err).toBeNull();
        resolve(resp);
      });
    });

    await promise1;

    const promise2 = new Promise((resolve) => {
      fileProviderClient.createProvider(createRequest, (err, resp) => {
        expect(err).toBeNull();
        resolve(resp);
      });
    });

    await promise2;
  });

  it('Deleting a file provider', async () => {
    const createRequest: CreateFileProviderRequest = {
      providerName: 'Test Provider2',
      configId: 0,
      configEnv: 'prod',
      accessKey: JSON.stringify({
        publicAccessKey: 'accessKey',
        privateAccessKey: 'privateKey',
      }),
      metadata: 'Test metadata',
      bucket: [],
      type: FileProviderProto.ProviderType.S3,
    };

    const promise1 = new Promise((resolve) => {
      fileProviderClient.createProvider(createRequest, (err, resp) => {
        expect(err).toBeNull();
        resolve(resp);
      });
    });

    await promise1;

    const deleteRequest: DeleteFileProviderRequest = {
      providerName: 'Test Provider2',
      configId: 0,
      configEnv: 'prod',
    };

    const promise2 = new Promise((resolve) => {
      fileProviderClient.deleteProvider(deleteRequest, (err, resp) => {
        expect(err).toBeNull();
        resolve(resp);
      });
    });

    await promise2;
  });

  it('Deleting a nonexistent file provider', async () => {
    const deleteRequest: DeleteFileProviderRequest = {
      providerName: 'Test Provider3',
      configId: 0,
      configEnv: 'prod',
    };

    const promise = new Promise((resolve) => {
      fileProviderClient.deleteProvider(deleteRequest, (err, resp) => {
        expect(err).not.toBeNull();
        resolve(resp);
      });
    });

    await promise;
  });

  it('Updating a file provider with new key', async () => {
    const createRequest: CreateFileProviderRequest = {
      providerName: 'Test Provider4',
      configId: 0,
      configEnv: 'prod',
      accessKey: JSON.stringify({
        publicAccessKey: 'accessKey',
        privateAccessKey: 'privateKey',
      }),
      metadata: 'Test metadata',
      bucket: [],
      type: FileProviderProto.ProviderType.S3,
    };

    const promise1 = new Promise((resolve) => {
      fileProviderClient.createProvider(createRequest, (err, resp) => {
        expect(err).toBeNull();
        resolve(resp);
      });
    });

    await promise1;

    const updateRequest: UpdateFileProviderRequest = {
      providerName: 'Test Provider4',
      configId: 0,
      configEnv: 'prod',
      accessKey: JSON.stringify({
        publicAccessKey: 'newAccessKey',
        privateAccessKey: 'privateKey',
      }),
      bucket: [],
    };

    const promise2 = new Promise((resolve) => {
      fileProviderClient.updateProvider(updateRequest, (err, resp) => {
        expect(err).toBeNull();
        resolve(resp);
      });
    });

    await promise2;
  });

  it('Updating a file provider with new metadata', async () => {
    const createRequest: CreateFileProviderRequest = {
      providerName: 'Test Provider6',
      configId: 0,
      configEnv: 'prod',
      accessKey: JSON.stringify({
        publicAccessKey: 'accessKey',
        privateAccessKey: 'privateKey',
      }),
      metadata: 'Test metadata',
      bucket: [],
      type: FileProviderProto.ProviderType.S3,
    };

    const promise1 = new Promise((resolve) => {
      fileProviderClient.createProvider(createRequest, (err, resp) => {
        expect(err).toBeNull();
        resolve(resp);
      });
    });

    await promise1;

    const updateRequest: UpdateFileProviderRequest = {
      providerName: 'Test Provider6',
      configId: 0,
      configEnv: 'prod',
      metadata: 'New metadata',
      bucket: [],
    };

    const promise2 = new Promise((resolve) => {
      fileProviderClient.updateProvider(updateRequest, (err, resp) => {
        expect(err).toBeNull();
        resolve(resp);
      });
    });

    await promise2;
  });

  it('Reading a nonexistent file provider', async () => {
    const getRequest: GetFileProviderRequest = {
      providerName: 'Test Provider7',
      configId: 0,
      configEnv: 'prod',
    };

    const promise = new Promise((resolve) => {
      fileProviderClient.getProvider(getRequest, (err, resp) => {
        expect(err).not.toBeNull();
        resolve(resp);
      });
    });

    await promise;
  });

  it('Reading a file provider', async () => {
    const createRequest: CreateFileProviderRequest = {
      providerName: 'Test Provider8',
      configId: 0,
      configEnv: 'prod',
      accessKey: JSON.stringify({
        publicAccessKey: 'accessKey',
        privateAccessKey: 'privateKey',
      }),
      metadata: 'Test metadata',
      bucket: [],
      type: FileProviderProto.ProviderType.S3,
    };

    const promise1 = new Promise((resolve) => {
      fileProviderClient.createProvider(createRequest, (err, resp) => {
        expect(err).toBeNull();
        resolve(resp);
      });
    });

    await promise1;

    const getRequest: GetFileProviderRequest = {
      providerName: 'Test Provider8',
      configId: 0,
      configEnv: 'prod',
    };

    const promise2 = new Promise((resolve) => {
      fileProviderClient.getProvider(getRequest, (err, resp) => {
        expect(err).toBeNull();
        resolve(resp);
      });
    });

    await promise2;
  });

  function call<T>(method: string, req: object): Promise<T> {
    return new Promise((resolve, reject) => {
      fileProviderClient[method](req, (err, resp) =>
        err ? reject(err) : resolve(resp),
      );
    });
  }

  function providerRequest(
    providerName: string,
    configEnv: string,
    endpoint = 'https://example.com',
  ): CreateFileProviderRequest {
    return {
      providerName,
      accessKey: JSON.stringify({ accessKeyId: 'id', secretAccessKey: 'key' }),
      metadata: JSON.stringify({ endpoint }),
      bucket: [],
      type: FileProviderProto.ProviderType.S3,
      configId: 0,
      configEnv,
    };
  }

  describe('scoped to a file config', () => {
    // A second config for the seed project (0, prod is seeded).
    const otherEnv = 'provider-scope';

    let otherConfigCreated = false;

    // beforeEach, not beforeAll: the db-service app only listens per test.
    beforeEach(async () => {
      if (otherConfigCreated) return;
      const configProto = ProtoLoader.loadSync([FileConfigProtoFile]) as any;
      const configGRPC = GRPC.loadPackageDefinition(configProto) as any;
      const configClient =
        new configGRPC.juno.file_service.config.FileServiceConfigDbService(
          process.env.DB_SERVICE_ADDR,
          GRPC.credentials.createInsecure(),
        );
      await new Promise((resolve, reject) => {
        configClient.createConfig(
          { projectId: 0, environment: otherEnv, buckets: [], files: [] },
          (err, resp) => (err ? reject(err) : resolve(resp)),
        );
      });
      otherConfigCreated = true;
    });

    it('returns the id and owning config on create', async () => {
      const provider = await call<FileProviderProto.FileProvider>(
        'createProvider',
        providerRequest('Scoped Provider', 'prod'),
      );
      expect(typeof provider.id).toBe('number');
      expect(provider.configId).toBe(0);
      expect(provider.configEnv).toBe('prod');
    });

    it('allows the same name in two configs', async () => {
      const prod = await call<FileProviderProto.FileProvider>(
        'createProvider',
        providerRequest('Same Name', 'prod', 'https://prod.example.com'),
      );
      const other = await call<FileProviderProto.FileProvider>(
        'createProvider',
        providerRequest('Same Name', otherEnv, 'https://other.example.com'),
      );
      expect(prod.id).not.toBe(other.id);

      const fetched = await call<FileProviderProto.FileProvider>(
        'getProvider',
        { providerName: 'Same Name', configId: 0, configEnv: otherEnv },
      );
      expect(fetched.id).toBe(other.id);
      expect(JSON.parse(fetched.metadata).endpoint).toBe(
        'https://other.example.com',
      );
    });

    it('getProvidersByConfigId returns only that config', async () => {
      await call('createProvider', providerRequest('Only Other', otherEnv));

      const res = await call<FileProviderProto.FileProviders>(
        'getProvidersByConfigId',
        { configId: 0, configEnv: otherEnv },
      );
      const names = res.providers.map((p) => p.providerName);
      expect(names).toEqual(
        expect.arrayContaining(['Same Name', 'Only Other']),
      );
      expect(names).not.toContain('Scoped Provider');
      expect(
        res.providers.every(
          (p) => p.configId === 0 && p.configEnv === otherEnv,
        ),
      ).toBe(true);
    });

    it('getProvidersByConfigId returns an empty list for a config with no providers', async () => {
      const res = await call<FileProviderProto.FileProviders>(
        'getProvidersByConfigId',
        { configId: 12345, configEnv: 'prod' },
      );
      expect(res.providers ?? []).toEqual([]);
    });

    it('getProvidersByConfigId requires configEnv', async () => {
      await expect(
        call('getProvidersByConfigId', { configId: 0, configEnv: '' }),
      ).rejects.toBeDefined();
    });

    it('does not find a provider through another config', async () => {
      await expect(
        call('getProvider', {
          providerName: 'Only Other',
          configId: 0,
          configEnv: 'prod',
        }),
      ).rejects.toBeDefined();
    });

    it('does not delete a provider through another config', async () => {
      await expect(
        call('deleteProvider', {
          providerName: 'Only Other',
          configId: 0,
          configEnv: 'prod',
        }),
      ).rejects.toBeDefined();
      const stillThere = await call<FileProviderProto.FileProvider>(
        'getProvider',
        { providerName: 'Only Other', configId: 0, configEnv: otherEnv },
      );
      expect(stillThere.providerName).toBe('Only Other');
    });

    it('fails to create a provider for a config that does not exist', async () => {
      await expect(
        call('createProvider', {
          ...providerRequest('Orphan', 'prod'),
          configId: 999,
        }),
      ).rejects.toMatchObject({ code: GRPC.status.FAILED_PRECONDITION });
    });

    it('fails to create a provider without a config env', async () => {
      await expect(
        call('createProvider', providerRequest('No Env', '')),
      ).rejects.toMatchObject({ code: GRPC.status.INVALID_ARGUMENT });
    });
  });
});
