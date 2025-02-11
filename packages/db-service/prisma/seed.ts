import { FileProviderType, PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  await prisma.user.upsert({
    where: { email: 'test-superadmin@test.com' },
    update: {},
    create: {
      id: 0,
      name: 'test',
      email: 'test-superadmin@test.com',
      password: await bcrypt.hash('test-password', 10),
      type: Role.SUPERADMIN,
    },
  });

  await prisma.project.upsert({
    where: { name: 'test-seed-project' },
    update: {},
    create: {
      id: 0,
      name: 'test-seed-project',
    },
  });

  await prisma.emailServiceConfig.upsert({
    where: {
      id_environment: {
        environment: 'prod',
        id: 0,
      },
    },
    update: {},
    create: {
      id: 0,
      environment: 'prod',
      sendgridApiKey: 'test-key',
    },
  });

  await prisma.emailDomain.upsert({
    where: { domain: 'testdomain' },
    update: {},
    create: {
      domain: 'testdomain',
      subdomain: 'testsubdomain',
      sendgridId: 0,
      attachedConfigs: {
        connectOrCreate: {
          create: {
            configId: 0,
            configEnv: 'prod',
          },
          where: {
            configId_configEnv_domainStr: {
              configId: 0,
              configEnv: 'prod',
              domainStr: 'testdomain',
            },
          },
        },
      },
    },
  });

  await prisma.fileServiceConfig.upsert({
    where: {
      id_environment: {
        environment: 'prod',
        id: 0,
      },
    },
    update: {},
    create: {
      id: 0,
    },
  });

  await prisma.fileProvider.upsert({
    where: {
      name: 'test-provider',
    },
    update: {},
    create: {
      name: 'test-provider',
      accessKey: 'test-key',
      type: FileProviderType.S3,
      metadata: '',
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
