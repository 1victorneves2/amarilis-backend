import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/products/search/:query  — must come before /:id to avoid conflict
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
  } catch (error) {
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
  } catch (error) {
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
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/products (admin)
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user || user.role !== 'admin') {
      res.status(403).json({ error: 'Admin access required' });
      return;
    }

    const { name, slug, description, price, stock, categoryId, images } = req.body as {
      name: string;
      slug: string;
      description?: string;
      price: number;
      stock?: number;
      categoryId?: string;
      images?: string[];
    };

    if (!name || !slug || price === undefined) {
      res.status(400).json({ error: 'name, slug and price are required' });
      return;
    }

    if (typeof price !== 'number' || price < 0) {
      res.status(400).json({ error: 'price must be a non-negative number' });
      return;
    }

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
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/products/:id (admin)
router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user || user.role !== 'admin') {
      res.status(403).json({ error: 'Admin access required' });
      return;
    }

    const id = req.params['id'] as string;
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    const { name, description, price, stock, categoryId, images, active } = req.body as {
      name?: string;
      description?: string;
      price?: number;
      stock?: number;
      categoryId?: string | null;
      images?: string[];
      active?: boolean;
    };

    if (price !== undefined && (typeof price !== 'number' || price < 0)) {
      res.status(400).json({ error: 'price must be a non-negative number' });
      return;
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(price !== undefined && { price }),
        ...(stock !== undefined && { stock }),
        ...(categoryId !== undefined && { categoryId }),
        ...(images !== undefined && { images }),
        ...(active !== undefined && { active }),
      },
      include: { category: { select: { id: true, name: true, slug: true } } },
    });
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/products/:id (admin)
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user || user.role !== 'admin') {
      res.status(403).json({ error: 'Admin access required' });
      return;
    }

    const id = req.params['id'] as string;
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    await prisma.product.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
