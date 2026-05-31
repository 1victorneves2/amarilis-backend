import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';
import { adminMiddleware } from '../middleware/admin';
import { CreateCategorySchema, UpdateCategorySchema, parseBody } from '../utils/validation';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { products: true } } },
    });
    res.json(categories);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params['id'] as string;
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        products: {
          where: { active: true },
          orderBy: { name: 'asc' },
        },
      },
    });
    if (!category) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }
    res.json(category);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  const result = parseBody(CreateCategorySchema, req.body);
  if (!result.success) {
    res.status(400).json({ error: result.error });
    return;
  }
  const { name, slug, description } = result.data;

  try {
    const existing = await prisma.category.findFirst({
      where: { OR: [{ name }, { slug }] },
    });
    if (existing) {
      res.status(400).json({ error: 'Category with this name or slug already exists' });
      return;
    }

    const category = await prisma.category.create({ data: { name, slug, description } });
    res.status(201).json(category);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  const id = req.params['id'] as string;

  const result = parseBody(UpdateCategorySchema, req.body);
  if (!result.success) {
    res.status(400).json({ error: result.error });
    return;
  }

  try {
    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }

    const category = await prisma.category.update({
      where: { id },
      data: result.data,
    });
    res.json(category);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  const id = req.params['id'] as string;

  try {
    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }

    await prisma.category.delete({ where: { id } });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
