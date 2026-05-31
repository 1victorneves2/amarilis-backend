import prisma from '../lib/prisma';

function randPrice(min: number, max: number) {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

function randStock(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function main() {
  console.log('Seeding products...');

  const [maquiagem, skincare, perfumes, cabelos, corpos] = await Promise.all([
    prisma.category.findUnique({ where: { slug: 'maquiagem' } }),
    prisma.category.findUnique({ where: { slug: 'skincare' } }),
    prisma.category.findUnique({ where: { slug: 'perfumes' } }),
    prisma.category.findUnique({ where: { slug: 'cabelos' } }),
    prisma.category.findUnique({ where: { slug: 'corpo-banho' } }),
  ]);

  if (!maquiagem || !skincare || !perfumes || !cabelos || !corpos) {
    console.error('Run seed-categories.ts first!');
    process.exit(1);
  }

  const products = [
    // Maquiagem (5)
    { name: 'Base Líquida FPS 30', slug: 'base-liquida-fps30', description: 'Base de alta cobertura com proteção solar', price: randPrice(60, 150), stock: randStock(20, 100), categoryId: maquiagem.id },
    { name: 'Batom Matte Vermelho', slug: 'batom-matte-vermelho', description: 'Batom de longa duração com acabamento matte', price: randPrice(30, 80), stock: randStock(30, 80), categoryId: maquiagem.id },
    { name: 'Paleta de Sombras 12 Cores', slug: 'paleta-sombras-12', description: 'Paleta com tons neutros e vibrantes', price: randPrice(80, 200), stock: randStock(20, 60), categoryId: maquiagem.id },
    { name: 'Blush Natural Rosé', slug: 'blush-natural-rose', description: 'Blush em pó com acabamento natural', price: randPrice(40, 90), stock: randStock(25, 70), categoryId: maquiagem.id },
    { name: 'Rímel Volume Extremo', slug: 'rimel-volume-extremo', description: 'Rímel para volume e alongamento máximo', price: randPrice(35, 95), stock: randStock(30, 90), categoryId: maquiagem.id },

    // Skincare (4)
    { name: 'Sérum Vitamina C 20%', slug: 'serum-vitamina-c-20', description: 'Sérum iluminador com ácido ascórbico puro', price: randPrice(80, 250), stock: randStock(20, 60), categoryId: skincare.id },
    { name: 'Hidratante Facial FPS 50', slug: 'hidratante-facial-fps50', description: 'Hidratante leve com proteção solar de amplo espectro', price: randPrice(70, 180), stock: randStock(30, 80), categoryId: skincare.id },
    { name: 'Ácido Hialurônico Concentrado', slug: 'acido-hialuronico-concentrado', description: 'Sérum de alta concentração para hidratação profunda', price: randPrice(90, 220), stock: randStock(15, 50), categoryId: skincare.id },
    { name: 'Tônico Micelar Calmante', slug: 'tonico-micelar-calmante', description: 'Tônico suave para pele sensível', price: randPrice(40, 110), stock: randStock(30, 90), categoryId: skincare.id },

    // Perfumes (4)
    { name: 'Eau de Parfum Floral', slug: 'edp-floral', description: 'Fragrância floral com notas de jasmim e rosa', price: randPrice(120, 300), stock: randStock(15, 45), categoryId: perfumes.id },
    { name: 'Colônia Cítrica Fresca', slug: 'colonia-citrica-fresca', description: 'Fragrância leve e refrescante para o dia a dia', price: randPrice(60, 150), stock: randStock(20, 60), categoryId: perfumes.id },
    { name: 'Perfume Oriental Amadeirado', slug: 'perfume-oriental-amadeirado', description: 'Fragrância intensa com notas de sândalo e baunilha', price: randPrice(150, 300), stock: randStock(10, 35), categoryId: perfumes.id },
    { name: 'Body Splash Tropical', slug: 'body-splash-tropical', description: 'Splash refrescante com frutas tropicais', price: randPrice(30, 70), stock: randStock(40, 100), categoryId: perfumes.id },

    // Cabelos (4)
    { name: 'Shampoo Reconstrutor', slug: 'shampoo-reconstrutor', description: 'Shampoo com queratina para cabelos danificados', price: randPrice(35, 90), stock: randStock(40, 100), categoryId: cabelos.id },
    { name: 'Máscara Hidratação Intensa', slug: 'mascara-hidratacao-intensa', description: 'Máscara com manteiga de karité e argan', price: randPrice(45, 120), stock: randStock(30, 80), categoryId: cabelos.id },
    { name: 'Óleo Finalizador Brilho', slug: 'oleo-finalizador-brilho', description: 'Óleo leve anti-frizz com toque seco', price: randPrice(50, 130), stock: randStock(25, 70), categoryId: cabelos.id },
    { name: 'Condicionador Nutritivo', slug: 'condicionador-nutritivo', description: 'Condicionador com proteínas da seda', price: randPrice(30, 80), stock: randStock(40, 90), categoryId: cabelos.id },

    // Corpo & Banho (4)
    { name: 'Creme Hidratante Corporal', slug: 'creme-hidratante-corporal', description: 'Creme com manteiga de karité para pele seca', price: randPrice(35, 100), stock: randStock(40, 100), categoryId: corpos.id },
    { name: 'Esfoliante Corporal Açúcar', slug: 'esfoliante-corporal-acucar', description: 'Esfoliante suave com açúcar e óleo de coco', price: randPrice(30, 80), stock: randStock(30, 80), categoryId: corpos.id },
    { name: 'Óleo Corporal Relaxante', slug: 'oleo-corporal-relaxante', description: 'Óleo com lavanda e camomila para pele sedosa', price: randPrice(40, 110), stock: randStock(25, 65), categoryId: corpos.id },
    { name: 'Sabonete Líquido Aromas', slug: 'sabonete-liquido-aromas', description: 'Sabonete líquido suave com fragrâncias naturais', price: randPrice(20, 55), stock: randStock(50, 100), categoryId: corpos.id },
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: { price: p.price, stock: p.stock },
      create: p,
    });
    console.log(`  ✓ ${p.name}`);
  }

  console.log(`Products seeded successfully! (${products.length} products)`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
