import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Create a demo tenant
  const tenant = await prisma.tenant.create({
    data: {
      name: 'Demo School',
      subdomain: 'demo',
    },
  });

  // Create an admin user for the tenant
  const hashedPassword = await bcrypt.hash('admin123', 10);
  await prisma.user.create({
    data: {
      email: 'admin@demoschool.com',
      password: hashedPassword,
      name: 'Admin User',
      role: 'admin',
      tenantId: tenant.id,
    },
  });

  console.log('Seed data created successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });