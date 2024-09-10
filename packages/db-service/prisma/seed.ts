import { PrismaClient, Role } from '@prisma/client';
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
