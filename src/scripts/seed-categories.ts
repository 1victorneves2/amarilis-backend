import prisma from '../lib/prisma';

const categories = [
  {
    name: 'Maquiagem',
    slug: 'maquiagem',
    description: 'Base, batom, sombra, blush e tudo para realçar sua beleza',
  },
  {
    name: 'Skincare',
    slug: 'skincare',
    description: 'Hidratantes, séruns, protetores solares e cuidados com a pele',
  },
  {
    name: 'Perfumes',
    slug: 'perfumes',
    description: 'Fragrâncias nacionais e importadas para todos os gostos',
  },
  {
    name: 'Cabelos',
    slug: 'cabelos',
    description: 'Shampoos, condicionadores, máscaras e finalizadores',
  },
  {
    name: 'Corpo & Banho',
    slug: 'corpo-banho',
    description: 'Hidratantes corporais, óleos, esfoliantes e produtos de banho',
  },
];

async function main() {
  console.log('Seeding categories...');
  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, description: cat.description },
      create: cat,
    });
    console.log(`  ✓ ${cat.name}`);
  }
  console.log('Categories seeded successfully!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
