import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
try {
  const result = await prisma.$queryRaw`SELECT 1`;
  console.log('OK:', result);
} catch (e) {
  console.error('FALLÓ:', e);
} finally {
  await prisma.$disconnect();
}
