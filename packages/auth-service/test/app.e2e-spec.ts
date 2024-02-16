import { Test, TestingModule } from '@nestjs/testing';
import { INestMicroservice } from '@nestjs/common';
import { AppModule } from './../src/app.module';
import * as ProtoLoader from '@grpc/proto-loader';
import * as GRPC from '@grpc/grpc-js';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import {
  ApiKeyProto,
  ApiKeyProtoFile,
  JwtProto,
  JwtProtoFile,
  ResetProtoFile,
  UserProto,
} from 'juno-proto';

let app: INestMicroservice;

jest.setTimeout(10000);

beforeAll(async () => {
  const proto = ProtoLoader.loadSync([ResetProtoFile]) as any;

  const protoGRPC = GRPC.loadPackageDefinition(proto) as any;
  const resetClient = new protoGRPC.juno.reset_db.DatabaseReset(
    process.env.DB_SERVICE_ADDR,
    GRPC.credentials.createInsecure(),
  );
  await new Promise((resolve) => {
    resetClient.resetDb({}, (err, resp) => {
      console.log(resp);
      resolve(0);
    });
  });

  const projectClient = new protoGRPC.dbservice.project.ProjectService(
    process.env.DB_SERVICE_ADDR,
    GRPC.credentials.createInsecure(),
  );

  const userClient = new protoGRPC.dbservice.user.UserService(
    process.env.DB_SERVICE_ADDR,
    GRPC.credentials.createInsecure(),
  );

  await new Promise((resolve, reject) => {
    projectClient.createProject({ name: 'project' }, (err, resp) => {
      if (err) return reject(err);
      console.log('Project created:', resp);
      resolve(resp);
    });
  });

  // Create user
  await new Promise((resolve, reject) => {
    userClient.createUser(
      {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        type: UserProto.UserType.USER,
      },
      (err, resp) => {
        if (err) return reject(err);
        console.log('User created:', resp);
        resolve(resp);
      },
    );
  });
});

beforeEach(async () => {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  app = moduleFixture.createNestMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: [
        ApiKeyProto.JUNO_API_KEY_PACKAGE_NAME,
        JwtProto.JUNO_JWT_PACKAGE_NAME,
      ],
      protoPath: [ApiKeyProtoFile, JwtProtoFile],
      url: process.env.AUTH_SERVICE_ADDR,
    },
  });

  await app.init();

  await app.listen();
});

afterEach(async () => {
  app.close();
});

describe('Auth Service API Key Tests', () => {
  let client: any;

  beforeEach(async () => {
    const proto = ProtoLoader.loadSync(ApiKeyProtoFile) as any;

    const protoGRPC = GRPC.loadPackageDefinition(proto) as any;

    client = new protoGRPC.authservice.api_key.ApiKeyService(
      process.env.AUTH_SERVICE_ADDR,
      GRPC.credentials.createInsecure(),
    );
  });

  it('issues an API key with correct parameters', async () => {
    const response = await new Promise((resolve, reject) => {
      client.issueApiKey(
        {
          project: { name: 'project' },
          email: 'test@example.com',
          password: 'password123',
          description: 'Valid API key',
        },
        (err, resp) => {
          if (err) return reject(err);
          return resolve(resp);
        },
      );
    });

    expect(response).toBeDefined();
  });

  it('rejects new key creation when one already exists for a project', async () => {
    client.issueApiKey({
      project: { name: 'project' },
      email: 'test@example.com',
      password: 'password123',
      description: 'Valid API key',
    });

    await expect(
      new Promise((resolve, reject) => {
        client.issueApiKey(
          {
            project: { name: 'project' },
            email: 'test@example.com',
            password: 'password123',
            description: 'Duplicate project API key request',
          },
          (err, resp) => {
            if (err) return reject(err);
            return resolve(resp);
          },
        );
      }),
    ).rejects.toBeDefined(); // Expecting an error due to duplicate project API key
  });

  it('rejects new key creation with invalid parameters', async () => {
    await expect(
      new Promise((resolve, reject) => {
        client.issueApiKey(
          {
            email: 'test@example.com',
            password: 'password123',
          },
          (err, resp) => {
            if (err) return reject(err);
            return resolve(resp);
          },
        );
      }),
    ).rejects.toBeDefined(); // Expecting an error due to invalid parameters
  });

  it('rejects new key creation with an invalid master password', async () => {
    await expect(
      new Promise((resolve, reject) => {
        client.issueApiKey(
          {
            project_name: 'project',
            email: 'test@example.com',
            password: 'notthepassword123',
            description: 'API key request with invalid password',
          },
          (err, resp) => {
            if (err) return reject(err);
            return resolve(resp);
          },
        );
      }),
    ).rejects.toBeDefined(); // Expecting an error due to invalid master password
  });

  // it('revokes an API key', async () => {
  //   const promise = new Promise((resolve) => {
  //     client.revokeApiKey({}, (err, resp) => {
  //       expect(err).toBeNull();
  //       expect(resp).toStrictEqual({});
  //       resolve({});
  //     });
  //   });
  //
  //   await promise;
  // });
});

// describe('Auth Service JWT Tests', () => {
//   let client: any;
//
//   beforeEach(async () => {
//     const proto = ProtoLoader.loadSync(
//       join(__dirname, '../../proto/auth-service/jwt.proto'),
//     ) as any;
//
//     const protoGRPC = GRPC.loadPackageDefinition(proto) as any;
//
//     client = new protoGRPC.authservice.api_key.ApiKeyService(
//       process.env.AUTH_SERVICE_ADDR,
//       GRPC.credentials.createInsecure(),
//     );
//   });
//
//   it('creates a JWT', async () => {
//     const promise = new Promise((resolve) => {
//       client.createJWT({}, (err, resp) => {
//         expect(err).toBeNull();
//         expect(resp).toStrictEqual({});
//         resolve({});
//       });
//     });
//
//     await promise;
//   });
//
//   it('validates a JWT', async () => {
//     const promise = new Promise((resolve) => {
//       client.revokeApiKey({}, (err, resp) => {
//         expect(err).toBeNull();
//         expect(resp).toStrictEqual({});
//         resolve({});
//       });
//     });
//
//     await promise;
//   });
// });
