import { Test, TestingModule } from '@nestjs/testing';
import {
  ClassSerializerInterceptor,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { AppModule } from './../src/app.module';
import { Reflector } from '@nestjs/core';
import * as request from 'supertest';
import { ResetProtoFile } from 'juno-proto';
import * as GRPC from '@grpc/grpc-js';
import * as ProtoLoader from '@grpc/proto-loader';

let app: INestApplication;
const ADMIN_EMAIL = 'test-superadmin@test.com';
const ADMIN_PASSWORD = 'test-password';
let apiKey: string | undefined = undefined;

async function APIKeyForProjectName(projectName: string): Promise<string> {
  const key = await request(app.getHttpServer())
    .post('/auth/key')
    .set('X-User-Email', ADMIN_EMAIL)
    .set('X-User-Password', ADMIN_PASSWORD)
    .send({
      environment: 'prod',
      project: {
        name: projectName,
      },
    });

  return key.body['apiKey'];
}

beforeAll(async () => {
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

afterAll((done) => {
  app.close();
  done();
});

beforeEach(async () => {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  app = moduleFixture.createNestApplication();
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
    }),
  );
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  await app.init();

  if (!apiKey) {
    apiKey = await APIKeyForProjectName('test-seed-project');
  }
});

describe('File Provider Verification Routes', () => {
  it('Missing provider name file provider without auth key', () => {
    const fileProviderBody = {
      providerName: '',
      accessKey: {
        publicAccessKey: 'Test Public Access Key',
        privateAccessKey: 'Test Private Access Key',
      },
      baseUrl: 'https://aws.amazon.com/s3',
      type: 'S3',
    };

    return request(app.getHttpServer())
      .post('/file/provider')
      .send(fileProviderBody)
      .expect(401);
  });

  it('Missing public access key file provider without auth key', () => {
    const fileProviderBody = {
      providerName: 'Test Provider',
      accessKey: {
        publicAccessKey: '',
        privateAccessKey: 'Test Private Access Key',
      },
      baseUrl: 'https://aws.amazon.com/s3',
      type: 'S3',
    };

    return request(app.getHttpServer())
      .post('/file/provider')
      .send(fileProviderBody)
      .expect(401);
  });

  it('Missing private access key file provider without auth key', () => {
    const fileProviderBody = {
      providerName: 'Test Provider',
      accessKey: {
        publicAccessKey: 'Test Public Access Key',
        privateAccessKey: '',
      },
      baseUrl: 'https://aws.amazon.com/s3',
      type: 'S3',
    };

    return request(app.getHttpServer())
      .post('/file/provider')
      .send(fileProviderBody)
      .expect(401);
  });

  it('Missing base url file provider without auth key', () => {
    const fileProviderBody = {
      providerName: 'Test Provider',
      accessKey: {
        publicAccessKey: 'Test Public Access Key',
        privateAccessKey: 'Test Private Access Key',
      },
      baseUrl: '',
      type: 'S3',
    };

    return request(app.getHttpServer())
      .post('/file/provider')
      .send(fileProviderBody)
      .expect(401);
  });

  it('Valid file provider without auth key', () => {
    const fileProviderBody = {
      providerName: 'Test Provider',
      accessKey: {
        publicAccessKey: 'Test Public Access Key',
        privateAccessKey: 'Test Private Access Key',
      },
      baseUrl: 'https://aws.amazon.com/s3',
      type: 'S3',
    };

    return request(app.getHttpServer())
      .post('/file/provider')
      .send(fileProviderBody)
      .expect(401);
  });

  it('Missing provider name file provider with auth key', () => {
    const fileProviderBody = {
      providerName: '',
      accessKey: {
        publicAccessKey: 'Test Public Access Key',
        privateAccessKey: 'Test Private Access Key',
      },
      baseUrl: 'https://aws.amazon.com/s3',
      type: 'S3',
    };

    return request(app.getHttpServer())
      .post('/file/provider')
      .set('Authorization', 'Bearer ' + apiKey)
      .send(fileProviderBody)
      .expect(400);
  });

  it('Missing public access key file provider with auth key', () => {
    const fileProviderBody = {
      providerName: 'Test Provider',
      accessKey: {
        publicAccessKey: '',
        privateAccessKey: 'Test Private Access Key',
      },
      baseUrl: 'https://aws.amazon.com/s3',
      type: 'S3',
    };

    return request(app.getHttpServer())
      .post('/file/provider')
      .set('Authorization', 'Bearer ' + apiKey)
      .send(fileProviderBody)
      .expect(400);
  });

  it('Missing private access key file provider with auth key', () => {
    const fileProviderBody = {
      providerName: 'Test Provider',
      accessKey: {
        publicAccessKey: 'Test Public Access Key',
        privateAccessKey: '',
      },
      baseUrl: 'https://aws.amazon.com/s3',
      type: 'S3',
    };

    return request(app.getHttpServer())
      .post('/file/provider')
      .set('Authorization', 'Bearer ' + apiKey)
      .send(fileProviderBody)
      .expect(400);
  });

  it('Missing base url file provider with auth key', () => {
    const fileProviderBody = {
      providerName: 'Test Provider',
      accessKey: {
        publicAccessKey: 'Test Public Access Key',
        privateAccessKey: 'Test Private Access Key',
      },
      baseUrl: '',
      type: 'S3',
    };

    return request(app.getHttpServer())
      .post('/file/provider')
      .set('Authorization', 'Bearer ' + apiKey)
      .send(fileProviderBody)
      .expect(400);
  });

  it('Valid file provider with auth key', async () => {
    const fileProviderBody = {
      providerName: 'Test Provider',
      accessKey: {
        publicAccessKey: 'Test Public Access Key',
        privateAccessKey: 'Test Private Access Key',
      },
      baseUrl: 'https://aws.amazon.com/s3',
      type: 'S3',
    };

    return request(app.getHttpServer())
      .post('/file/provider')
      .set('Authorization', 'Bearer ' + apiKey)
      .send(fileProviderBody)
      .expect(201);
  });
});

async function createProject(name: string): Promise<number> {
  const res = await request(app.getHttpServer())
    .post('/project')
    .set('X-User-Email', ADMIN_EMAIL)
    .set('X-User-Password', ADMIN_PASSWORD)
    .send({ name })
    .expect(201);
  // Project ids are int64 and can come back as a protobuf Long.
  return Number(res.body['id']?.low ?? res.body['id']);
}

async function createUser(email: string): Promise<number> {
  const res = await request(app.getHttpServer())
    .post('/user')
    .set('X-User-Email', ADMIN_EMAIL)
    .set('X-User-Password', ADMIN_PASSWORD)
    .send({ name: 'Provider Scope User', email, password: 'password' })
    .expect(201);
  return res.body['id'];
}

async function JWTforUser(email: string, password: string): Promise<string> {
  const res = await request(app.getHttpServer())
    .post('/auth/user/jwt')
    .set('X-User-Email', email)
    .set('X-User-Password', password)
    .send()
    .expect(201);
  return res.body['token'];
}

function providerBody(providerName: string, baseUrl: string) {
  return {
    providerName,
    accessKey: {
      publicAccessKey: 'public-key',
      privateAccessKey: 'private-key',
    },
    baseUrl,
    type: 'S3',
  };
}

interface ProviderScopingFixtures {
  projectAId: number;
  projectBId: number;
  apiKeyA: string;
  apiKeyB: string;
  apiKeyNoConfig: string;
  scopedAdminJwt: string; // ADMIN linked to project A only
  superadminJwt: string;
}

let fixtures: ProviderScopingFixtures | undefined;

// Two projects with file services set up, one project without, an admin
// linked to project A only, and the seed superadmin. Created once, lazily.
async function getFixtures(): Promise<ProviderScopingFixtures> {
  if (fixtures) {
    return fixtures;
  }

  const projectAId = await createProject('provider-scope-a');
  const projectBId = await createProject('provider-scope-b');
  await createProject('provider-scope-no-config');
  const apiKeyA = await APIKeyForProjectName('provider-scope-a');
  const apiKeyB = await APIKeyForProjectName('provider-scope-b');
  const apiKeyNoConfig = await APIKeyForProjectName('provider-scope-no-config');

  for (const key of [apiKeyA, apiKeyB]) {
    await request(app.getHttpServer())
      .post('/file/config/setup')
      .set('Authorization', 'Bearer ' + key)
      .send()
      .expect(201);
  }

  const adminEmail = 'provider-scope-admin@example.com';
  const adminId = await createUser(adminEmail);
  await request(app.getHttpServer())
    .post('/user/type')
    .set('X-User-Email', ADMIN_EMAIL)
    .set('X-User-Password', ADMIN_PASSWORD)
    .send({ email: adminEmail, type: 'ADMIN' })
    .expect(201);
  await request(app.getHttpServer())
    .put(`/user/id/${adminId}/project`)
    .set('X-User-Email', ADMIN_EMAIL)
    .set('X-User-Password', ADMIN_PASSWORD)
    .send({ name: 'provider-scope-a' })
    .expect(200);

  // Same provider name in both projects: names are unique per file config.
  await request(app.getHttpServer())
    .post('/file/provider')
    .set('Authorization', 'Bearer ' + apiKeyA)
    .send(providerBody('shared-name', 'https://a.example.com'))
    .expect(201);
  await request(app.getHttpServer())
    .post('/file/provider')
    .set('Authorization', 'Bearer ' + apiKeyA)
    .send(providerBody('a-only', 'https://a.example.com'))
    .expect(201);
  await request(app.getHttpServer())
    .post('/file/provider')
    .set('Authorization', 'Bearer ' + apiKeyB)
    .send(providerBody('shared-name', 'https://b.example.com'))
    .expect(201);

  fixtures = {
    projectAId,
    projectBId,
    apiKeyA,
    apiKeyB,
    apiKeyNoConfig,
    scopedAdminJwt: await JWTforUser(adminEmail, 'password'),
    superadminJwt: await JWTforUser(ADMIN_EMAIL, ADMIN_PASSWORD),
  };
  return fixtures;
}

describe('File Provider Project Scoping', () => {
  it('Registers a provider linked to the API key project config', async () => {
    const f = await getFixtures();
    const res = await request(app.getHttpServer())
      .post('/file/provider')
      .set('Authorization', 'Bearer ' + f.apiKeyA)
      .send(providerBody('registered-a', 'https://a.example.com'))
      .expect(201);

    expect(res.body.providerName).toBe('registered-a');
    expect(res.body.configId).toBe(f.projectAId);
    expect(res.body.configEnv).toBe('prod');
    expect(typeof res.body.id).toBe('number');
  });

  it('Fails to register a provider when the project has no file config', async () => {
    const f = await getFixtures();
    await request(app.getHttpServer())
      .post('/file/provider')
      .set('Authorization', 'Bearer ' + f.apiKeyNoConfig)
      .send(providerBody('no-config', 'https://x.example.com'))
      .expect(400);
  });

  it("Lists only the config's own providers", async () => {
    const f = await getFixtures();
    const resA = await request(app.getHttpServer())
      .get(`/file/provider/config/${f.projectAId}`)
      .set('Authorization', 'Bearer ' + f.apiKeyA)
      .expect(200);

    const namesA = resA.body.map((p) => p.providerName);
    expect(namesA).toEqual(expect.arrayContaining(['shared-name', 'a-only']));
    expect(resA.body.every((p) => p.configId === f.projectAId)).toBe(true);
    expect(
      resA.body.find((p) => p.providerName === 'shared-name').baseUrl,
    ).toBe('https://a.example.com');

    const resB = await request(app.getHttpServer())
      .get(`/file/provider/config/${f.projectBId}`)
      .set('Authorization', 'Bearer ' + f.apiKeyB)
      .expect(200);

    expect(resB.body.map((p) => p.providerName)).toEqual(['shared-name']);
    expect(resB.body[0].baseUrl).toBe('https://b.example.com');
  });

  it("Forbids listing another project's config with an API key", async () => {
    const f = await getFixtures();
    await request(app.getHttpServer())
      .get(`/file/provider/config/${f.projectBId}`)
      .set('Authorization', 'Bearer ' + f.apiKeyA)
      .expect(403);
  });

  it('Rejects a malformed config id', async () => {
    const f = await getFixtures();
    await request(app.getHttpServer())
      .get('/file/provider/config/abc')
      .set('Authorization', 'Bearer ' + f.apiKeyA)
      .expect(400);
  });

  it('Requires authentication to list providers by config', async () => {
    const f = await getFixtures();
    await request(app.getHttpServer())
      .get(`/file/provider/config/${f.projectAId}`)
      .expect(401);
  });

  it('Lists a linked project with x-user-jwt + x-project-id', async () => {
    const f = await getFixtures();
    const res = await request(app.getHttpServer())
      .get(`/file/provider/config/${f.projectAId}`)
      .set('Authorization', 'Bearer ' + apiKey)
      .set('x-user-jwt', f.scopedAdminJwt)
      .set('x-project-id', String(f.projectAId))
      .expect(200);
    expect(res.body.every((p) => p.configId === f.projectAId)).toBe(true);
  });

  it('Fails with 401 for x-project-id of a project the user is not linked to', async () => {
    const f = await getFixtures();
    await request(app.getHttpServer())
      .get(`/file/provider/config/${f.projectBId}`)
      .set('Authorization', 'Bearer ' + apiKey)
      .set('x-user-jwt', f.scopedAdminJwt)
      .set('x-project-id', String(f.projectBId))
      .expect(401);
  });

  it("Re-registering a name in one project leaves the other project's provider alone", async () => {
    const f = await getFixtures();
    await request(app.getHttpServer())
      .post('/file/provider')
      .set('Authorization', 'Bearer ' + f.apiKeyB)
      .send(providerBody('shared-name', 'https://b2.example.com'))
      .expect(201);

    const resA = await request(app.getHttpServer())
      .get(`/file/provider/config/${f.projectAId}`)
      .set('Authorization', 'Bearer ' + f.apiKeyA)
      .expect(200);
    expect(
      resA.body.find((p) => p.providerName === 'shared-name').baseUrl,
    ).toBe('https://a.example.com');
  });

  it("Cannot delete another project's provider", async () => {
    const f = await getFixtures();
    const res = await request(app.getHttpServer())
      .delete('/file/provider/a-only')
      .set('Authorization', 'Bearer ' + f.apiKeyB);
    expect(res.status).toBeGreaterThanOrEqual(400);

    const resA = await request(app.getHttpServer())
      .get(`/file/provider/config/${f.projectAId}`)
      .set('Authorization', 'Bearer ' + f.apiKeyA)
      .expect(200);
    expect(resA.body.map((p) => p.providerName)).toContain('a-only');
  });

  it("Deletes the project's own provider", async () => {
    const f = await getFixtures();
    await request(app.getHttpServer())
      .post('/file/provider')
      .set('Authorization', 'Bearer ' + f.apiKeyA)
      .send(providerBody('to-delete', 'https://a.example.com'))
      .expect(201);

    const res = await request(app.getHttpServer())
      .delete('/file/provider/to-delete')
      .set('Authorization', 'Bearer ' + f.apiKeyA)
      .expect(200);
    expect(res.body.providerName).toBe('to-delete');
    expect(res.body.configId).toBe(f.projectAId);

    const resA = await request(app.getHttpServer())
      .get(`/file/provider/config/${f.projectAId}`)
      .set('Authorization', 'Bearer ' + f.apiKeyA)
      .expect(200);
    expect(resA.body.map((p) => p.providerName)).not.toContain('to-delete');
  });

  it('Forbids listing all providers without a superadmin user', async () => {
    const f = await getFixtures();
    await request(app.getHttpServer())
      .get('/file/provider/all')
      .set('Authorization', 'Bearer ' + f.apiKeyA)
      .expect(403);
    await request(app.getHttpServer())
      .get('/file/provider/all')
      .set('Authorization', 'Bearer ' + apiKey)
      .set('x-user-jwt', f.scopedAdminJwt)
      .expect(403);
  });

  it('Lists all providers for a superadmin', async () => {
    const f = await getFixtures();
    const res = await request(app.getHttpServer())
      .get('/file/provider/all')
      .set('Authorization', 'Bearer ' + apiKey)
      .set('x-user-jwt', f.superadminJwt)
      .expect(200);
    const configIds = new Set(res.body.map((p) => p.configId));
    expect(configIds.has(f.projectAId)).toBe(true);
    expect(configIds.has(f.projectBId)).toBe(true);
  });
});
