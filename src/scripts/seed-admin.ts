import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const email = process.env.ADMIN_SETUP_EMAIL;
const password = process.env.ADMIN_SETUP_PASSWORD;

async function main() {
  if (!email || !password) return;

  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return;

    const hash = await bcrypt.hash(password, 12);
    await prisma.user.create({
      data: { email, password: hash, name: 'Amarilis Admin', role: 'admin' },
    });

    console.log(`[seed-admin] Admin criado: ${email}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('[seed-admin] Erro:', err);
  process.exit(1);
});
