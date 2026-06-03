import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  const token = req.headers['x-seed-token'];
  const expected = process.env.SEED_TOKEN;

  if (!expected || token !== expected) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    // --- Categories (upsert = safe to run multiple times) ---
    const categoryData = [
      { name: 'Maquiagem',    slug: 'maquiagem',   description: 'Base, batom, sombra, blush e tudo para realcar sua beleza' },
      { name: 'Skincare',     slug: 'skincare',    description: 'Hidratantes, seruns, protetores solares e cuidados com a pele' },
      { name: 'Perfumes',     slug: 'perfumes',    description: 'Fragrancias nacionais e importadas para todos os gostos' },
      { name: 'Cabelos',      slug: 'cabelos',     description: 'Shampoos, condicionadores, mascaras e finalizadores' },
      { name: 'Corpo & Banho', slug: 'corpo-banho', description: 'Hidratantes corporais, oleos, esfoliantes e produtos de banho' },
    ];

    for (const cat of categoryData) {
      await prisma.category.upsert({
        where: { slug: cat.slug },
        update: { name: cat.name, description: cat.description },
        create: cat,
      });
    }

    const [maquiagem, skincare, perfumes, cabelos, corpos] = await Promise.all([
      prisma.category.findUnique({ where: { slug: 'maquiagem' } }),
      prisma.category.findUnique({ where: { slug: 'skincare' } }),
      prisma.category.findUnique({ where: { slug: 'perfumes' } }),
      prisma.category.findUnique({ where: { slug: 'cabelos' } }),
      prisma.category.findUnique({ where: { slug: 'corpo-banho' } }),
    ]);

    if (!maquiagem || !skincare || !perfumes || !cabelos || !corpos) {
      res.status(500).json({ error: 'Category lookup failed after upsert' });
      return;
    }

    // --- Products (upsert = safe to run multiple times) ---
    const products = [
      { name: 'Base Liquida FPS 30',           slug: 'base-liquida-fps30',           description: 'Base de alta cobertura com protecao solar',              price: 89.90,  stock: 50, categoryId: maquiagem.id },
      { name: 'Batom Matte Vermelho',           slug: 'batom-matte-vermelho',          description: 'Batom de longa duracao com acabamento matte',            price: 45.90,  stock: 60, categoryId: maquiagem.id },
      { name: 'Paleta de Sombras 12 Cores',     slug: 'paleta-sombras-12',            description: 'Paleta com tons neutros e vibrantes',                    price: 129.90, stock: 35, categoryId: maquiagem.id },
      { name: 'Blush Natural Rose',             slug: 'blush-natural-rose',           description: 'Blush em po com acabamento natural',                     price: 55.90,  stock: 45, categoryId: maquiagem.id },
      { name: 'Rimel Volume Extremo',           slug: 'rimel-volume-extremo',          description: 'Rimel para volume e alongamento maximo',                 price: 59.90,  stock: 55, categoryId: maquiagem.id },
      { name: 'Serum Vitamina C 20%',           slug: 'serum-vitamina-c-20',          description: 'Serum iluminador com acido ascorbico puro',              price: 149.90, stock: 30, categoryId: skincare.id },
      { name: 'Hidratante Facial FPS 50',       slug: 'hidratante-facial-fps50',      description: 'Hidratante leve com protecao solar de amplo espectro',   price: 99.90,  stock: 40, categoryId: skincare.id },
      { name: 'Acido Hialuronico Concentrado',  slug: 'acido-hialuronico-concentrado', description: 'Serum de alta concentracao para hidratacao profunda',  price: 139.90, stock: 25, categoryId: skincare.id },
      { name: 'Tonico Micelar Calmante',        slug: 'tonico-micelar-calmante',      description: 'Tonico suave para pele sensivel',                        price: 69.90,  stock: 50, categoryId: skincare.id },
      { name: 'Eau de Parfum Floral',           slug: 'edp-floral',                   description: 'Fragancia floral com notas de jasmim e rosa',            price: 219.90, stock: 20, categoryId: perfumes.id },
      { name: 'Colonia Citrica Fresca',         slug: 'colonia-citrica-fresca',       description: 'Fragancia leve e refrescante para o dia a dia',          price: 99.90,  stock: 35, categoryId: perfumes.id },
      { name: 'Perfume Oriental Amadeirado',    slug: 'perfume-oriental-amadeirado',  description: 'Fragancia intensa com notas de sandalo e baunilha',      price: 249.90, stock: 15, categoryId: perfumes.id },
      { name: 'Body Splash Tropical',           slug: 'body-splash-tropical',         description: 'Splash refrescante com frutas tropicais',                price: 49.90,  stock: 70, categoryId: perfumes.id },
      { name: 'Shampoo Reconstrutor',           slug: 'shampoo-reconstrutor',         description: 'Shampoo com queratina para cabelos danificados',         price: 59.90,  stock: 60, categoryId: cabelos.id },
      { name: 'Mascara Hidratacao Intensa',     slug: 'mascara-hidratacao-intensa',   description: 'Mascara com manteiga de karite e argan',                 price: 79.90,  stock: 45, categoryId: cabelos.id },
      { name: 'Oleo Finalizador Brilho',        slug: 'oleo-finalizador-brilho',      description: 'Oleo leve anti-frizz com toque seco',                   price: 89.90,  stock: 40, categoryId: cabelos.id },
      { name: 'Condicionador Nutritivo',        slug: 'condicionador-nutritivo',      description: 'Condicionador com proteinas da seda',                    price: 49.90,  stock: 65, categoryId: cabelos.id },
      { name: 'Creme Hidratante Corporal',      slug: 'creme-hidratante-corporal',    description: 'Creme com manteiga de karite para pele seca',            price: 65.90,  stock: 60, categoryId: corpos.id },
      { name: 'Esfoliante Corporal Acucar',     slug: 'esfoliante-corporal-acucar',   description: 'Esfoliante suave com acucar e oleo de coco',             price: 55.90,  stock: 50, categoryId: corpos.id },
      { name: 'Oleo Corporal Relaxante',        slug: 'oleo-corporal-relaxante',      description: 'Oleo com lavanda e camomila para pele sedosa',           price: 75.90,  stock: 40, categoryId: corpos.id },
      { name: 'Sabonete Liquido Aromas',        slug: 'sabonete-liquido-aromas',      description: 'Sabonete liquido suave com fragrancias naturais',        price: 35.90,  stock: 80, categoryId: corpos.id },
    ];

    for (const p of products) {
      await prisma.product.upsert({
        where: { slug: p.slug },
        update: { price: p.price, stock: p.stock },
        create: p,
      });
    }

    res.json({
      success: true,
      categories: categoryData.length,
      products: products.length,
      message: `${categoryData.length} categorias e ${products.length} produtos criados/atualizados.`,
    });
  } catch (error) {
    console.error('[seed] error:', error);
    res.status(500).json({ error: 'Seed failed' });
  }
});

export default router;
