import { Test, TestingModule } from '@nestjs/testing';
import { INestMicroservice } from '@nestjs/common';
import { AppModule } from './../src/app.module';
import * as ProtoLoader from '@grpc/proto-loader';
import * as GRPC from '@grpc/grpc-js';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import {
  ApiKeyProto,
  ApiKeyProtoFile,
  HealthProto,
  HealthProtoFile,
  IdentifiersProtoFile,
  JwtProto,
  JwtProtoFile,
  ProjectProtoFile,
  ResetProtoFile,
  UserProtoFile,
} from 'juno-proto';
import { User, UserType } from 'juno-proto/dist/gen/user';

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
        ApiKeyProto.JUNO_API_KEY_PACKAGE_NAME,
        JwtProto.JUNO_JWT_PACKAGE_NAME,
        HealthProto.GRPC_HEALTH_V1_PACKAGE_NAME,
      ],
      protoPath: [ApiKeyProtoFile, HealthProtoFile, JwtProtoFile],
      url: process.env.AUTH_SERVICE_ADDR,
    },
  });

  await app.init();

  await app.listen();
  return app;
}

beforeAll(async () => {
  app = await initApp();

  const proto = ProtoLoader.loadSync([
    ResetProtoFile,
    IdentifiersProtoFile,
    UserProtoFile,
    ProjectProtoFile,
    ApiKeyProtoFile,
  ]) as any;

  const protoGRPC = GRPC.loadPackageDefinition(proto) as any;

  const resetClient = new protoGRPC.juno.reset_db.DatabaseReset(
    process.env.DB_SERVICE_ADDR,
    GRPC.credentials.createInsecure(),
  );
  const projectClient = new protoGRPC.juno.project.ProjectService(
    process.env.DB_SERVICE_ADDR,
    GRPC.credentials.createInsecure(),
  );
  const userClient = new protoGRPC.juno.user.UserService(
    process.env.DB_SERVICE_ADDR,
    GRPC.credentials.createInsecure(),
  );

  await new Promise((resolve) => {
    resetClient.resetDb({}, () => {
      resolve(0);
    });
  });

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
        name: 'Test-User',
        type: 'USER',
      },
      (err, resp) => {
        if (err) return reject(err);
        console.log('User created:', resp);
        resolve(resp);
      },
    );
  });
});

afterAll(() => {
  app.close();
});

describe('Auth Service API Key Tests', () => {
  let apiKeyClient: any;

  beforeEach(async () => {
    const proto = ProtoLoader.loadSync(ApiKeyProtoFile) as any;

    const protoGRPC = GRPC.loadPackageDefinition(proto) as any;

    apiKeyClient = new protoGRPC.juno.api_key.ApiKeyService(
      process.env.AUTH_SERVICE_ADDR,
      GRPC.credentials.createInsecure(),
    );
  });

  it('issues an API key with correct parameters', async () => {
    const response = await new Promise((resolve, reject) => {
      apiKeyClient.issueApiKey(
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

  it('rejects new key creation with invalid parameters', async () => {
    await expect(
      new Promise((resolve, reject) => {
        apiKeyClient.issueApiKey(
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
        apiKeyClient.issueApiKey(
          {
            project: { name: 'project' },
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

describe('User authentication tests', () => {
  let client: any;

  const correctUserResponse: User = {
    id: 0,
    email: 'testing@gmail.com',
    name: 'TEST',
    type: UserType.USER,
  };

  beforeEach(async () => {
    const proto = ProtoLoader.loadSync(ApiKeyProtoFile) as any;

    const protoGRPC = GRPC.loadPackageDefinition(proto) as any;

    client = new protoGRPC.authservice.api_key.UserService(
      process.env.AUTH_SERVICE_ADDR,
      GRPC.credentials.createInsecure(),
    );
  });
  it('User auth with an invalid email format', async () => {
    const promise = new Promise((resolve) => {
      client.authenticate(
        { email: 'testing', password: 'testing123' },
        (err, resp) => {
          expect(err).toThrowError('email must be an email');
          expect(resp).toStrictEqual({});
          resolve({});
        },
      );
    });

    await promise;
  });
  it('User auth with an invalid email that is not in the database', async () => {
    const promise = new Promise((resolve) => {
      client.authenticate(
        { email: 'testing@gmail.com', password: 'testing123' },
        (err, resp) => {
          expect(err).toThrowError(
            'The email provided does not exist within the database.',
          );
          expect(resp).toStrictEqual({});
          resolve({});
        },
      );
    });

    await promise;
  });

  it('User auth with an empty password', async () => {
    const promise = new Promise((resolve) => {
      client.authenticate(
        { email: 'testing@gmail.com', password: '' },
        (err, resp) => {
          expect(err).toThrowError('password should not be empty');
          expect(resp).toStrictEqual({});
          resolve({});
        },
      );
    });

    await promise;
  });
  it('User auth with an invalid password and user within db', async () => {
    const promise = new Promise((resolve) => {
      client.authenticate(
        { email: 'testing@gmail.com', password: 'testing' },
        (err, resp) => {
          expect(err).toThrowError('The password is invalid.');
          expect(resp).toStrictEqual({});
          resolve({});
        },
      );
    });

    await promise;
  });
  it('User auth with correct credentials', async () => {
    const promise = new Promise((resolve) => {
      client.authenticate(
        { email: 'testing@gmail.com', password: 'testing123' },
        (err, resp) => {
          expect(err).toBeNull();
          expect(resp).toStrictEqual(correctUserResponse);
          resolve({});
        },
      );
    });

    await promise;
  });
});
