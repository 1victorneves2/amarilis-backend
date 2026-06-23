import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  await prisma.$executeRaw`
    DELETE FROM "_prisma_migrations"
    WHERE migration_name = '20260623004924_add_stock_system'
  `
  console.log('Migration removida da tabela de controle.')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
