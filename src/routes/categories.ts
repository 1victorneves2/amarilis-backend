import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { products: true } } },
    });
    res.json(categories);
  } catch (error) {
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
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user || user.role !== 'admin') {
      res.status(403).json({ error: 'Admin access required' });
      return;
    }

    const { name, slug, description } = req.body as {
      name: string;
      slug: string;
      description?: string;
    };

    if (!name || !slug) {
      res.status(400).json({ error: 'name and slug are required' });
      return;
    }

    const existing = await prisma.category.findFirst({
      where: { OR: [{ name }, { slug }] },
    });
    if (existing) {
      res.status(400).json({ error: 'Category with this name or slug already exists' });
      return;
    }

    const category = await prisma.category.create({
      data: { name, slug, description },
    });
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user || user.role !== 'admin') {
      res.status(403).json({ error: 'Admin access required' });
      return;
    }

    const id = req.params['id'] as string;
    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }

    const { name, description } = req.body as { name?: string; description?: string };

    const category = await prisma.category.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
      },
    });
    res.json(category);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user || user.role !== 'admin') {
      res.status(403).json({ error: 'Admin access required' });
      return;
    }

    const id = req.params['id'] as string;
    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }

    await prisma.category.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
