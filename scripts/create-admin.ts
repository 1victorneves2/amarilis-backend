import prisma from '../src/lib/prisma';
import { hashPassword } from '../src/utils/auth';

const ADMIN_EMAIL = 'admin@amarilis.com';
const ADMIN_PASSWORD = 'Amarilis@2024';

async function main() {
  // Verificar admins existentes
  const existing = await prisma.user.findMany({
    where: { role: 'admin' },
    select: { id: true, email: true, name: true, role: true },
  });

  console.log(`\nAdmins encontrados no banco: ${existing.length}`);
  if (existing.length > 0) {
    existing.forEach((u) => console.log(`  - ${u.email} (${u.role})`));
  }

  // Criar/atualizar admin
  const hashed = await hashPassword(ADMIN_PASSWORD);

  const admin = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {
      password: hashed,
      role: 'admin',
    },
    create: {
      email: ADMIN_EMAIL,
      password: hashed,
      name: 'Admin',
      role: 'admin',
    },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  });

  console.log('\n✅ Admin pronto:');
  console.log(`  Email : ${admin.email}`);
  console.log(`  Role  : ${admin.role}`);
  console.log(`  ID    : ${admin.id}`);
  console.log('\n🔑 Credenciais de login:');
  console.log(`  Email : ${ADMIN_EMAIL}`);
  console.log(`  Senha : ${ADMIN_PASSWORD}`);
}

main()
  .catch((err) => { console.error('Erro:', err); process.exit(1); })
  .finally(() => prisma.$disconnect().then(() => process.exit(0)));
