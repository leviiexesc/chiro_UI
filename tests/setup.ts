import { beforeAll, afterAll, afterEach } from 'vitest';
import { PrismaClient } from '@prisma/client';

// Use a separate test database or isolate using transactions
const prisma = new PrismaClient({
  datasources: {
    db: { url: process.env.DATABASE_URL || 'postgresql://localhost:5432/chiro_test?schema=public' },
  },
});

beforeAll(async () => {
  // Clean slate for test run
  await prisma.auditLog.deleteMany();
  await prisma.device.deleteMany();
  await prisma.license.deleteMany();
  await prisma.product.deleteMany();
  await prisma.adminUser.deleteMany();
});

afterEach(async () => {
  // No-op: tests clean up their own state to preserve ordering
});

afterAll(async () => {
  await prisma.$disconnect();
});

export { prisma };
