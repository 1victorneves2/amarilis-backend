import prisma from '../src/lib/prisma';

const products = [
  {
    name: 'Sérum Facial Vitamina C',
    slug: 'serum-facial-vitamina-c',
    description: 'Sérum iluminador com vitamina C pura 20%, reduz manchas e uniformiza o tom da pele.',
    price: 89.9,
    image: null,
    stock: 42,
    active: true,
  },
  {
    name: 'Hidratante Corporal Rosa Mosqueta',
    slug: 'hidratante-corporal-rosa-mosqueta',
    description: 'Hidratante intensivo com óleo de rosa mosqueta, para pele seca e ressecada.',
    price: 54.9,
    image: null,
    stock: 75,
    active: true,
  },
  {
    name: 'Shampoo Nutritivo Argan',
    slug: 'shampoo-nutritivo-argan',
    description: 'Shampoo com óleo de argan marroquino, nutre e suaviza cabelos danificados.',
    price: 38.5,
    image: null,
    stock: 60,
    active: true,
  },
  {
    name: 'Máscara Capilar Mel e Queratina',
    slug: 'mascara-capilar-mel-queratina',
    description: 'Máscara de tratamento profundo com mel e queratina, restaura o fio sem peso.',
    price: 67.0,
    image: null,
    stock: 33,
    active: true,
  },
  {
    name: 'Protetor Solar FPS 50 Cor Universal',
    slug: 'protetor-solar-fps50-cor-universal',
    description: 'Protetor solar com cor universal, FPS 50 e toque seco. Ideal para uso diário.',
    price: 79.9,
    image: null,
    stock: 88,
    active: true,
  },
];

async function main() {
  console.log('Iniciando seed de produtos...');

  for (const data of products) {
    const product = await prisma.product.upsert({
      where: { slug: data.slug },
      update: { price: data.price, stock: data.stock, active: data.active },
      create: data,
    });
    console.log(`  ✓ ${product.name} — estoque: ${product.stock}`);
  }

  console.log(`\nSeed concluído: ${products.length} produtos inseridos/atualizados.`);
}

main()
  .catch((e) => { console.error('Erro no seed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect().then(() => process.exit(0)));
