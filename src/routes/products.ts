import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';
import { adminMiddleware } from '../middleware/admin';
import { CreateProductSchema, UpdateProductSchema, parseBody } from '../utils/validation';

const router = Router();

// GET /api/products/search/:query  — must come before /:id
router.get('/search/:query', async (req: Request, res: Response) => {
  try {
    const query = req.params['query'] as string;
    const products = await prisma.product.findMany({
      where: {
        active: true,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { category: { name: { contains: query, mode: 'insensitive' } } },
        ],
      },
      include: { category: { select: { id: true, name: true, slug: true } } },
      orderBy: { name: 'asc' },
    });
    res.json(products);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/products?category=slug&skip=0&take=20&sort=name
router.get('/', async (req: Request, res: Response) => {
  try {
    const { category, skip = '0', take = '20', sort = 'name' } = req.query as {
      category?: string;
      skip?: string;
      take?: string;
      sort?: string;
    };

    const skipNum = Math.max(0, parseInt(skip, 10) || 0);
    const takeNum = Math.min(100, parseInt(take, 10) || 20);

    const validSorts: Record<string, object> = {
      name: { name: 'asc' },
      price_asc: { price: 'asc' },
      price_desc: { price: 'desc' },
      newest: { createdAt: 'desc' },
    };
    const orderBy = validSorts[sort] ?? { name: 'asc' };

    const where = {
      active: true,
      ...(category && { category: { slug: category } }),
    };

    const [data, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { category: { select: { id: true, name: true, slug: true } } },
        orderBy,
        skip: skipNum,
        take: takeNum,
      }),
      prisma.product.count({ where }),
    ]);

    res.json({ data, total, skip: skipNum, take: takeNum });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/products/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params['id'] as string;
    const product = await prisma.product.findUnique({
      where: { id },
      include: { category: { select: { id: true, name: true, slug: true } } },
    });
    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    res.json(product);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/products (admin)
router.post('/', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  const result = parseBody(CreateProductSchema, req.body);
  if (!result.success) {
    res.status(400).json({ error: result.error });
    return;
  }
  const { name, slug, description, price, stock, categoryId, images } = result.data;

  try {
    const existingSlug = await prisma.product.findUnique({ where: { slug } });
    if (existingSlug) {
      res.status(400).json({ error: 'Product with this slug already exists' });
      return;
    }

    const product = await prisma.product.create({
      data: {
        name,
        slug,
        description,
        price,
        stock: stock ?? 0,
        categoryId: categoryId ?? null,
        images: images ?? [],
      },
      include: { category: { select: { id: true, name: true, slug: true } } },
    });
    res.status(201).json(product);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/products/:id (admin)
router.put('/:id', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  const id = req.params['id'] as string;

  const result = parseBody(UpdateProductSchema, req.body);
  if (!result.success) {
    res.status(400).json({ error: result.error });
    return;
  }

  try {
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    const product = await prisma.product.update({
      where: { id },
      data: result.data,
      include: { category: { select: { id: true, name: true, slug: true } } },
    });
    res.json(product);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/products/:id (admin)
router.delete('/:id', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  const id = req.params['id'] as string;

  try {
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    await prisma.product.delete({ where: { id } });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
