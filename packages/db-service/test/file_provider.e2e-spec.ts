import { INestMicroservice } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { Test, TestingModule } from '@nestjs/testing';
import * as ProtoLoader from '@grpc/proto-loader';
import * as GRPC from '@grpc/grpc-js';

import {
  ResetProto,
  ResetProtoFile,
  FileProviderProto,
  FileProviderProtoFile,
} from 'juno-proto';
import { AppModule } from 'src/app.module';
import {
  CreateFileProviderRequest,
  DeleteFileProviderRequest,
  GetFileProviderRequest,
  UpdateFileProviderRequest,
} from 'juno-proto/dist/gen/file_provider';

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
        ResetProto.JUNO_RESET_DB_PACKAGE_NAME,
      ],
      protoPath: [FileProviderProtoFile, ResetProtoFile],
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
      accessKey: 'Test access key',
      metadata: 'Test metadata',
      bucket: [],
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
      accessKey: 'Test access key',
      metadata: 'Test metadata',
      bucket: [],
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
        expect(err).not.toBeNull();
        resolve(resp);
      });
    });

    await promise2;
  });

  it('Deleting a file provider', async () => {
    const createRequest: CreateFileProviderRequest = {
      providerName: 'Test Provider2',
      accessKey: 'Test access key',
      metadata: 'Test metadata',
      bucket: [],
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
    };

    const promise = new Promise((resolve) => {
      fileProviderClient.deleteProvider(deleteRequest, (err, resp) => {
        expect(err).not.toBeNull();
        resolve(resp);
      });
    });

    await promise;
  });

  it('Updating a file provider', async () => {
    const createRequest: CreateFileProviderRequest = {
      providerName: 'Test Provider4',
      accessKey: 'Test access key',
      metadata: 'Test metadata',
      bucket: [],
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
      accessKey: 'New access key',
      metadata: 'Test metadata',
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

  it('Updating a file provider', async () => {
    const createRequest: CreateFileProviderRequest = {
      providerName: 'Test Provider5',
      accessKey: 'Test access key',
      metadata: 'Test metadata',
      bucket: [],
    };

    const promise1 = new Promise((resolve) => {
      fileProviderClient.createProvider(createRequest, (err, resp) => {
        expect(err).toBeNull();
        resolve(resp);
      });
    });

    await promise1;

    const updateRequest: UpdateFileProviderRequest = {
      providerName: 'Test Provider5',
      accessKey: 'Test access key',
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
      providerName: 'Test Provider6',
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
      providerName: 'Test Provider7',
      accessKey: 'Test access key',
      metadata: 'Test metadata',
      bucket: [],
    };

    const promise1 = new Promise((resolve) => {
      fileProviderClient.createProvider(createRequest, (err, resp) => {
        expect(err).toBeNull();
        resolve(resp);
      });
    });

    await promise1;

    const getRequest: GetFileProviderRequest = {
      providerName: 'Test Provider7',
    };

    const promise2 = new Promise((resolve) => {
      fileProviderClient.getProvider(getRequest, (err, resp) => {
        expect(err).toBeNull();
        resolve(resp);
      });
    });

    await promise2;
  });
});
